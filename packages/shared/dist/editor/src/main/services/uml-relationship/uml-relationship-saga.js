import { all, call, getContext, put, select, take } from 'redux-saga/effects';
import { run } from '../../utils/actions/sagas';
import { diff } from '../../utils/fx/diff';
import { UMLElementRepository } from '../uml-element/uml-element-repository';
import { UMLRelationship } from './uml-relationship';
import { UMLRelationshipRepository } from './uml-relationship-repository';
import { UMLRelationshipType } from '../../packages/uml-relationship-type';
import { UMLDiagramRepository } from '../uml-diagram/uml-diagram-repository';
import { notEmpty } from '../../utils/not-empty';
export function* UMLRelationshipSaga() {
    yield run([create, reconnect, update, layoutElement, layoutRelationship, deleteElement]);
}
function* create() {
    const action = yield take("@@element/CREATE" /* UMLElementActionTypes.CREATE */);
    for (const value of action.payload.values) {
        yield call(recalc, value.id);
    }
}
function* reconnect() {
    const action = yield take("@@element/reconnectable/RECONNECT" /* ReconnectableActionTypes.RECONNECT */);
    for (const connection of action.payload.connections) {
        yield call(recalc, connection.id);
    }
}
function* layoutRelationship() {
    const action = yield take("@@relationship/waypoints/END" /* UMLRelationshipActionTypes.ENDWAYPOINTSLAYOUT */);
    const layer = yield getContext('layer');
    const { elements, diagram } = yield select();
    const children = [
        ...diagram.ownedElements.map((id) => UMLElementRepository.get(elements[id])),
        ...diagram.ownedRelationships.map((id) => UMLRelationshipRepository.get(elements[id])),
    ].filter(notEmpty);
    const container = UMLDiagramRepository.get(diagram);
    if (!container) {
        return;
    }
    const [updates] = container.render(layer, children);
    const delta = {
        width: updates.bounds.width - diagram.bounds.width,
        height: updates.bounds.height - diagram.bounds.height,
    };
    yield put({
        type: "@@element/resizable/RESIZE" /* ResizingActionTypes.RESIZE */,
        payload: { ids: [diagram.id], delta },
        undoable: false,
    });
    // Now find and update any relationships that connect to the moved relationship
    const movedRelationshipId = action.payload.id;
    const relationships = Object.values(elements).filter((x) => UMLRelationship.isUMLRelationship(x));
    // Find relationships that connect to our moved relationship
    const connectedRelationships = relationships.filter(relationship => relationship.source.element === movedRelationshipId ||
        relationship.target.element === movedRelationshipId).map(relationship => relationship.id);
    // Update each connected relationship
    for (const id of connectedRelationships) {
        yield call(recalc, id);
    }
}
function* update() {
    const action = yield take("@@element/UPDATE" /* UMLElementActionTypes.UPDATE */);
    const { elements } = yield select();
    // Check if this is an update from a property panel
    // Property panel updates typically have a small number of properties and only for a single element
    const isLikelyPanelUpdate = action.payload.values.length === 1 &&
        (Object.keys(action.payload.values[0]).length <= 3 ||
            'name' in action.payload.values[0] ||
            'source' in action.payload.values[0] ||
            'target' in action.payload.values[0]);
    for (const value of action.payload.values) {
        if (!UMLRelationship.isUMLRelationship(elements[value.id])) {
            continue;
        }
        // Skip recalculation for property panel updates if the relationship is manually laid out
        if (isLikelyPanelUpdate && elements[value.id].isManuallyLayouted) {
            // If this is a property panel update on a manually laid out relationship,
            // ensure the isManuallyLayouted flag is preserved
            yield put({
                type: "@@element/UPDATE" /* UMLElementActionTypes.UPDATE */,
                payload: {
                    values: [{
                            id: value.id,
                            isManuallyLayouted: true
                        }]
                },
                undoable: false
            });
            continue;
        }
        yield call(recalc, value.id);
    }
}
function* layoutElement() {
    const action = yield take(["@@element/movable/MOVE" /* MovingActionTypes.MOVE */, "@@element/resizable/RESIZE" /* ResizingActionTypes.RESIZE */]);
    const { elements } = yield select();
    const relationships = Object.values(elements).filter((x) => UMLRelationship.isUMLRelationship(x));
    // Track both directly and indirectly affected relationships
    const directUpdates = [];
    const allUpdates = new Set();
    // First pass: find direct relationships connected to moved elements
    loop: for (const relationship of relationships) {
        let source = relationship.source.element;
        while (source) {
            if (action.payload.ids.includes(source)) {
                directUpdates.push(relationship.id);
                allUpdates.add(relationship.id);
                continue loop;
            }
            source = elements[source].owner;
        }
        let target = relationship.target.element;
        while (target) {
            if (action.payload.ids.includes(target)) {
                directUpdates.push(relationship.id);
                allUpdates.add(relationship.id);
                continue loop;
            }
            target = elements[target].owner;
        }
    }
    // Process the direct updates first
    for (const id of directUpdates) {
        yield call(recalc, id);
    }
    // Second pass: find relationships connected to relationships that were updated
    // We may need multiple passes to handle deeply nested relationship chains
    let updatedInLastPass = [...directUpdates];
    let additionalUpdates = [];
    // Continue until no new updates are found
    while (updatedInLastPass.length > 0) {
        additionalUpdates = [];
        // Look for relationships connected to relationships updated in previous pass
        for (const relationship of relationships) {
            // Skip if this relationship was already updated
            if (allUpdates.has(relationship.id)) {
                continue;
            }
            // Check if this relationship connects to any updated relationship
            if (updatedInLastPass.includes(relationship.source.element) ||
                updatedInLastPass.includes(relationship.target.element)) {
                additionalUpdates.push(relationship.id);
                allUpdates.add(relationship.id);
            }
        }
        // Update these relationships
        for (const id of additionalUpdates) {
            yield call(recalc, id);
        }
        // Prepare for next pass
        updatedInLastPass = [...additionalUpdates];
    }
}
function* deleteElement() {
    const action = yield take("@@element/DELETE" /* UMLElementActionTypes.DELETE */);
    const { elements } = yield select();
    const relationships = Object.values(elements)
        .filter((x) => UMLRelationship.isUMLRelationship(x))
        .filter((relationship) => action.payload.ids.includes(relationship.source.element) ||
        action.payload.ids.includes(relationship.target.element))
        .map((relationship) => relationship.id);
    yield all([
        put({
            type: "@@element/container/REMOVE" /* UMLContainerActionTypes.REMOVE */,
            payload: { ids: relationships },
            undoable: false,
        }),
        put({
            type: "@@element/DELETE" /* UMLElementActionTypes.DELETE */,
            payload: { ids: relationships },
            undoable: false,
        }),
    ]);
}
export function* recalc(id) {
    const { elements, selected, editor } = yield select();
    const layer = yield getContext('layer');
    const relationship = UMLRelationshipRepository.get(elements[id]);
    if (!relationship) {
        return;
    }
    // Check if source is a relationship
    let source;
    if (UMLRelationship.isUMLRelationship(elements[relationship.source.element])) {
        source = UMLRelationshipRepository.get(elements[relationship.source.element]);
    }
    else {
        source = UMLElementRepository.get(elements[relationship.source.element]);
    }
    // Check if target is a relationship
    let target;
    if (UMLRelationship.isUMLRelationship(elements[relationship.target.element])) {
        target = UMLRelationshipRepository.get(elements[relationship.target.element]);
    }
    else {
        target = UMLElementRepository.get(elements[relationship.target.element]);
    }
    if (!source || !target) {
        return;
    }
    const sourcePosition = yield put(UMLElementRepository.getAbsolutePosition(relationship.source.element));
    source.bounds = { ...source.bounds, ...sourcePosition };
    const targetPosition = yield put(UMLElementRepository.getAbsolutePosition(relationship.target.element));
    target.bounds = { ...target.bounds, ...targetPosition };
    const original = elements[id];
    const [updates] = relationship.render(layer, source, target);
    const { path, bounds } = diff(original, updates);
    if (path) {
        // Check if this relationship connects to other relationships
        const connectsToRelationship = UMLRelationship.isUMLRelationship(elements[relationship.source.element]) ||
            UMLRelationship.isUMLRelationship(elements[relationship.target.element]);
        // If it connects to another relationship, we should always update its layout
        if (relationship.isManuallyLayouted && shouldPreserveLayout(source.id, target.id, selected, editor.readonly) && !connectsToRelationship) {
            yield put(UMLRelationshipRepository.layoutWaypoints(updates.id, original.path, { ...original.bounds, ...bounds }));
        }
        else {
            yield put(UMLRelationshipRepository.layout(updates.id, path, { ...original.bounds, ...bounds }));
        }
    }
    // layout messages of CommunicationLink
    if (updates.type === UMLRelationshipType.CommunicationLink) {
        yield put(UMLElementRepository.update(updates.id, updates));
    }
}
const shouldPreserveLayout = (sourceId, targetId, selected, isEditorReadOnly) => {
    return (selected.includes(sourceId) && selected.includes(targetId)) || isEditorReadOnly ? true : false;
};
//# sourceMappingURL=uml-relationship-saga.js.map