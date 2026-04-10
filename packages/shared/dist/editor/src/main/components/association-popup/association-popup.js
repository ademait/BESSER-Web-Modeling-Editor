import React, { Component, createRef } from 'react';
import { connect } from 'react-redux';
import { createPortal } from 'react-dom';
import { compose } from 'redux';
import styled from 'styled-components';
import { Button } from '../controls/button/button';
import { Divider } from '../controls/divider/divider';
import { Popover } from '../controls/popover/popover';
import { Header } from '../controls/typography/typography';
import { UMLElementRepository } from '../../services/uml-element/uml-element-repository';
import { AssociationPopup } from '../../services/uml-element/connectable/association-popup-repository';
import { diagramBridge } from '../../services/diagram-bridge';
import { withCanvas } from '../canvas/with-canvas';
import { withRoot } from '../root/with-root';
import { Point } from '../../utils/geometry/point';
import { uuid } from '../../utils/uuid';
import { UMLObjectLink } from '../../packages/uml-object-diagram/uml-object-link/uml-object-link';
import { Direction } from '../../services/uml-element/uml-element-port';
const PopupContainer = styled.div `
  min-width: 300px;
  max-width: 500px;
  max-height: 400px;
  overflow-y: auto;
`;
const AssociationList = styled.div `
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
`;
const AssociationItem = styled.div `
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background: #f9f9f9;
  cursor: pointer;
  transition: background-color 0.2s;
  &:hover {
    background: #f0f0f0;
  }
`;
const AssociationInfo = styled.div `
  display: flex;
  flex-direction: column;
  gap: 2px;
`;
const AssociationName = styled.span `
  font-weight: 500;
  color: #333;
`;
const AssociationDetails = styled.span `
  font-size: 12px;
  color: #666;
`;
const NoAssociationsMessage = styled.div `
  text-align: center;
  padding: 20px;
  color: #666;
  font-style: italic;
`;
const initialState = Object.freeze({
    position: null,
    placement: undefined,
    alignment: undefined,
});
class UnwrappedAssociationPopup extends Component {
    constructor() {
        super(...arguments);
        this.state = initialState;
        this.popover = createRef();
        this.ignoreNextDocumentClick = false;
        this.handleTargetSelect = (target) => {
            const { sourceObjectId, elements, palette } = this.props;
            if (!sourceObjectId || !target)
                return;
            const sourceObject = JSON.parse(JSON.stringify(elements[sourceObjectId]));
            for (const object of palette) {
                if (object.classId && object.classId === target.id) {
                    const newObject = {
                        ...object,
                    };
                    const newId = uuid();
                    newObject.id = newId;
                    newObject.bounds.x = sourceObject.bounds.x;
                    newObject.bounds.y = sourceObject.bounds.y + 100 + sourceObject.bounds.height;
                    newObject.ownedElements = [];
                    if (object.ownedElements) {
                        for (const ownedElement of object.ownedElements) {
                            for (const childObject of palette) {
                                if (ownedElement === childObject.id) {
                                    const newOwnedElement = {
                                        ...childObject,
                                    };
                                    const newOwnedId = uuid();
                                    newOwnedElement.id = newOwnedId;
                                    newObject.ownedElements.push(newOwnedId);
                                    newOwnedElement.owner = newId;
                                    this.props.create(newOwnedElement);
                                }
                            }
                        }
                    }
                    this.props.create(newObject);
                    this.createObjectLink(sourceObjectId, newObject.id);
                    break;
                }
            }
            this.handleClose();
        };
        this.createObjectLink = (source, target) => {
            const { isIconObjectDiagram } = this.props;
            const relationship = isIconObjectDiagram
                ? new UMLObjectLink({
                    id: uuid(),
                    name: '',
                    owner: null,
                    path: [],
                    bounds: {},
                    source: { element: source, direction: Direction.Down },
                    target: { element: target, direction: Direction.Up },
                })
                : new UMLObjectLink({
                    id: uuid(),
                    name: '',
                    owner: null,
                    path: [],
                    bounds: {},
                    source: { element: source, direction: Direction.Down },
                    target: { element: target, direction: Direction.Up },
                });
            this.props.createRelationship(relationship);
        };
        this.handleClose = () => {
            this.props.closePopup();
        };
        this.handleOutsideClick = (event) => {
            if (this.ignoreNextDocumentClick) {
                this.ignoreNextDocumentClick = false;
                return;
            }
            if (this.popover.current && !this.popover.current.contains(event.target)) {
                this.handleClose();
            }
        };
        this.position = () => {
            const { sourceObjectId, canvas, root, elements } = this.props;
            if (!sourceObjectId || !canvas || !root)
                return;
            const sourceElement = elements[sourceObjectId];
            if (!sourceElement)
                return;
            let absolute = new Point(sourceElement.bounds.x, sourceElement.bounds.y);
            if (canvas.origin && typeof canvas.origin === 'function') {
                const origin = canvas.origin();
                const rootRect = root.getBoundingClientRect();
                absolute = absolute.add(origin.x, origin.y).subtract(rootRect.x, rootRect.y);
            }
            const elementCenter = absolute.add(sourceElement.bounds.width / 2, sourceElement.bounds.height / 2);
            const position = absolute;
            const container = canvas.layer && canvas.layer.parentElement;
            let placement = 'right';
            let alignment = 'start';
            if (container) {
                const canvasBounds = container.getBoundingClientRect();
                placement = elementCenter.x < canvasBounds.width / 2 ? 'right' : 'left';
                alignment = elementCenter.y < canvasBounds.height / 2 ? 'start' : 'end';
            }
            if (placement === 'right') {
                position.x += sourceElement.bounds.width;
            }
            if (alignment === 'end') {
                position.y += sourceElement.bounds.height;
            }
            this.setState({ position, alignment, placement });
        };
    }
    componentDidUpdate(prevProps) {
        if (!prevProps.isOpen && this.props.isOpen) {
            setTimeout(this.position, 0);
            this.ignoreNextDocumentClick = true;
        }
    }
    componentDidMount() {
        document.addEventListener('click', this.handleOutsideClick);
    }
    componentWillUnmount() {
        document.removeEventListener('click', this.handleOutsideClick);
    }
    render() {
        const { isOpen, sourceObjectId } = this.props;
        const { position } = this.state;
        if (!isOpen || !sourceObjectId || !position) {
            return null;
        }
        const availableTargets = this.getAvailableTargets(Object.values(this.props.elements));
        return createPortal(React.createElement(Popover, { ref: this.popover, position: position, placement: this.state.placement, alignment: this.state.alignment, maxHeight: 400 },
            React.createElement(PopupContainer, null,
                React.createElement(Header, null, 'Add and connect to new Object'),
                React.createElement(Divider, null),
                this.renderTargetSelection(availableTargets),
                React.createElement(Divider, null),
                React.createElement("div", { style: { display: 'flex', justifyContent: 'flex-end', gap: '8px' } },
                    React.createElement(Button, { onClick: this.handleClose }, 'Cancel')))), this.props.root);
    }
    renderTargetSelection(targets) {
        if (targets.length === 0) {
            return (React.createElement(NoAssociationsMessage, null, 'No other objects available to connect to'));
        }
        return (React.createElement(AssociationList, null, targets.map((target) => (React.createElement(AssociationItem, { key: target.id, onClick: () => this.handleTargetSelect(target) },
            React.createElement(AssociationInfo, null,
                React.createElement(AssociationName, null, target.name)))))));
    }
    getAvailableTargets(elements) {
        const objectsWithClassId = elements.find((element) => element.classId && element.id === this.props.sourceObjectId);
        if (!objectsWithClassId)
            return [];
        const relatedClasses = diagramBridge.getRelatedClasses(objectsWithClassId.classId);
        return relatedClasses.map((cls) => ({
            id: cls.id,
            name: cls.name,
        }));
    }
}
const enhance = compose(withCanvas, withRoot, connect((state) => ({
    isOpen: state.associationPopup.isOpen,
    sourceObjectId: state.associationPopup.sourceObjectId,
    isIconObjectDiagram: state.associationPopup.isIconObjectDiagram,
    elements: state.elements,
    palette: state.palette,
}), {
    closePopup: AssociationPopup.close,
    createRelationship: UMLElementRepository.create,
    create: UMLElementRepository.create,
}));
export const AssociationPopupComponent = enhance(UnwrappedAssociationPopup);
//# sourceMappingURL=association-popup.js.map