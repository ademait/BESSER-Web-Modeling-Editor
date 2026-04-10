import React, { Component, createRef } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import styled from 'styled-components';
import { Button } from '../../../components/controls/button/button';
import { ColorButton } from '../../../components/controls/color-button/color-button';
import { diagramBridge } from '../../../services/diagram-bridge';
import { Divider } from '../../../components/controls/divider/divider';
import { Dropdown } from '../../../components/controls/dropdown/dropdown';
import { TrashIcon } from '../../../components/controls/icon/trash';
import { Textfield } from '../../../components/controls/textfield/textfield';
import { Body, Header } from '../../../components/controls/typography/typography';
import { localized } from '../../../components/i18n/localized';
import { StylePane } from '../../../components/style-pane/style-pane';
import { UMLElementRepository } from '../../../services/uml-element/uml-element-repository';
import { notEmpty } from '../../../utils/not-empty';
import { UMLObjectAttribute } from '../uml-object-attribute/uml-object-attribute';
import { UMLObjectMethod } from '../uml-object-method/uml-object-method';
import UMLObjectAttributeUpdate from '../uml-object-attribute/uml-object-attribute-update';
const Flex = styled.div `
  display: flex;
  align-items: baseline;
  justify-content: space-between;
`;
const ClassSelectionFlex = styled.div `
  display: flex;
  align-items: baseline;
  gap: 8px;
`;
const getInitialState = () => ({
    fieldToFocus: undefined,
    colorOpen: false,
});
class ObjectNameComponent extends Component {
    constructor() {
        super(...arguments);
        this.state = getInitialState();
        this.newMethodField = createRef();
        this.newAttributeField = createRef();
        this.toggleColor = () => {
            this.setState((state) => ({
                colorOpen: !state.colorOpen,
            }));
        };
        this.getAvailableClasses = () => {
            return diagramBridge.getAvailableClasses();
        };
        this.getClassDisplayName = (cls) => {
            const hierarchy = diagramBridge.getClassHierarchy(cls.id);
            let displayName = cls.name;
            // Show inheritance info if the class has parents
            if (hierarchy.length > 1) {
                const parents = hierarchy.slice(1); // Remove the class itself, keep parents
                displayName += ` extends ${parents.join(', ')}`;
            }
            // Show attribute count (including inherited)
            if (cls.attributes.length > 0) {
                displayName += ` (${cls.attributes.length} attrs)`;
            }
            return displayName;
        };
        this.onClassChange = (className) => {
            const { element, update, create, delete: deleteElement, getById } = this.props;
            // Find the selected class to get its ID
            const availableClasses = this.getAvailableClasses();
            const selectedClass = availableClasses.find(cls => cls.name === className);
            // Update the object with the class ID and potentially the name
            const updateData = {};
            if (selectedClass) {
                updateData.classId = selectedClass.id; // Store the class ID from the library
                // If the current name is "Object" or empty, update it with the new class-based name
                if (!element.name || element.name === 'Object') {
                    updateData.name = `${selectedClass.name.toLowerCase()}Instance`;
                }
            }
            else {
                updateData.classId = undefined; // Clear class ID if no class is selected
                // If current name was based on a class, reset to "Object"
                if (!element.name || element.name === 'Object') {
                    updateData.name = 'Object';
                }
            }
            update(element.id, updateData);
            // First, delete all existing attributes
            const children = element.ownedElements.map((id) => getById(id)).filter(notEmpty);
            const existingAttributes = children.filter((child) => child instanceof UMLObjectAttribute);
            existingAttributes.forEach((attr) => {
                deleteElement(attr.id);
            }); // If a class is selected, automatically add its attributes to the object (including inherited)
            if (className && selectedClass && selectedClass.attributes.length > 0) {
                // Create object attributes based on class attributes with proper format
                // Note: selectedClass.attributes already includes inherited attributes from parent classes
                selectedClass.attributes.forEach((attr) => {
                    const attribute = new UMLObjectAttribute();
                    // Format: "attributeName = " to show that it needs a value
                    attribute.name = `${attr.name} = `;
                    // Store the attribute ID from the library
                    attribute.attributeId = attr.id;
                    create(attribute, element.id);
                });
            }
        };
        this.getSelectedClass = () => {
            const { element } = this.props;
            const classId = element.classId;
            if (!classId)
                return '';
            // First try to find the class in available classes from diagramBridge
            const availableClasses = this.getAvailableClasses();
            let selectedClass = availableClasses.find(cls => cls.id === classId);
            // If not found in available classes, try to find it in the stored class diagram data
            if (!selectedClass) {
                const classDiagramData = diagramBridge.getClassDiagramData();
                if (classDiagramData && classDiagramData.elements) {
                    const refClass = classDiagramData.elements[classId];
                    if (refClass && refClass.type === 'Class') {
                        return refClass.name;
                    }
                }
            }
            return selectedClass ? selectedClass.name : '';
        };
        this.getSelectedClassId = () => {
            const { element } = this.props;
            return element.classId || '';
        };
        this.getObjectNamePlaceholder = () => {
            const selectedClassName = this.getSelectedClass();
            if (selectedClassName) {
                return `${selectedClassName.toLowerCase()}Instance`;
            }
            return 'objectName';
        };
        this.getDisplayName = () => {
            const { element } = this.props;
            // If name is empty or "Object", show placeholder as the actual value
            if (!element.name || element.name === 'Object') {
                return this.getObjectNamePlaceholder();
            }
            return element.name;
        };
        // Method to get class info by ID for verification
        this.getClassById = (classId) => {
            // First try in available classes
            const availableClasses = this.getAvailableClasses();
            let selectedClass = availableClasses.find(cls => cls.id === classId);
            // If not found, try in stored class diagram data
            if (!selectedClass) {
                const classDiagramData = diagramBridge.getClassDiagramData();
                if (classDiagramData && classDiagramData.elements) {
                    const refClass = classDiagramData.elements[classId];
                    if (refClass && refClass.type === 'Class') {
                        // Convert to IClassInfo format
                        return {
                            id: refClass.id,
                            name: refClass.name,
                            attributes: (refClass.attributes || []).map((attrId) => {
                                const attr = classDiagramData.elements[attrId];
                                return attr ? { id: attrId, name: attr.name } : null;
                            }).filter(Boolean)
                        };
                    }
                }
            }
            return selectedClass || null;
        };
        this.create = (Clazz) => (value) => {
            const { element, create } = this.props;
            const member = new Clazz();
            member.name = value;
            create(member, element.id);
        };
        this.rename = (id) => (name) => {
            this.props.update(id, { name });
        };
        this.delete = (id) => () => {
            this.props.delete(id);
        };
    }
    componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.state.fieldToFocus) {
            this.state.fieldToFocus.focus();
            this.setState({ fieldToFocus: undefined });
        }
    }
    render() {
        const { element, getById } = this.props;
        const children = element.ownedElements.map((id) => getById(id)).filter(notEmpty);
        const attributes = children.filter((child) => child instanceof UMLObjectAttribute);
        const methods = children.filter((child) => child instanceof UMLObjectMethod);
        const attributeRefs = [];
        const methodRefs = [];
        const availableClasses = this.getAvailableClasses();
        return (React.createElement("div", null,
            "        ",
            React.createElement("section", null,
                React.createElement(Flex, null,
                    React.createElement(Textfield, { value: this.getDisplayName(), onChange: this.rename(element.id), placeholder: this.getObjectNamePlaceholder(), autoFocus: true }),
                    React.createElement(ColorButton, { onClick: this.toggleColor }),
                    React.createElement(Button, { color: "link", tabIndex: -1, onClick: this.delete(element.id) },
                        React.createElement(TrashIcon, null))),
                availableClasses.length > 0 && (React.createElement("div", { style: { marginTop: '8px' } },
                    React.createElement(ClassSelectionFlex, null,
                        React.createElement(Body, { style: { marginRight: '0.5em' } }, "Class:"),
                        React.createElement(Dropdown, { value: this.getSelectedClass(), onChange: this.onClassChange }, [
                            React.createElement(Dropdown.Item, { key: "empty", value: "" }, "No class selected"),
                            ...availableClasses.map((cls) => (React.createElement(Dropdown.Item, { key: cls.id, value: cls.name }, this.getClassDisplayName(cls))))
                        ])))),
                React.createElement(StylePane, { open: this.state.colorOpen, element: element, onColorChange: this.props.update, fillColor: true, lineColor: true, textColor: true }),
                React.createElement(Divider, null)),
            React.createElement("section", null,
                "          ",
                React.createElement(Header, null, this.props.translate('popup.attributes')),
                attributes.map((attribute, index) => (React.createElement(UMLObjectAttributeUpdate, { id: attribute.id, key: attribute.id, value: attribute.name, onChange: this.props.update, onSubmitKeyUp: () => index === attributes.length - 1
                        ? this.newAttributeField.current?.focus()
                        : this.setState({
                            fieldToFocus: attributeRefs[index + 1],
                        }), onDelete: this.delete, onRefChange: (ref) => (attributeRefs[index] = ref), element: attribute }))))));
    }
}
const enhance = compose(localized, connect(null, {
    create: UMLElementRepository.create,
    update: UMLElementRepository.update,
    delete: UMLElementRepository.delete,
    getById: UMLElementRepository.getById,
}));
export const UMLObjectNameUpdate = enhance(ObjectNameComponent);
//# sourceMappingURL=uml-object-name-update.js.map