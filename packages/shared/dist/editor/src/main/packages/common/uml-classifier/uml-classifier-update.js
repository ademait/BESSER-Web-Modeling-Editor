import React, { Component, createRef } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import styled from 'styled-components';
import { Button } from '../../../components/controls/button/button';
import { ColorButton } from '../../../components/controls/color-button/color-button';
import { Divider } from '../../../components/controls/divider/divider';
import { TrashIcon } from '../../../components/controls/icon/trash';
import { Switch } from '../../../components/controls/switch/switch';
import { Textfield } from '../../../components/controls/textfield/textfield';
import { Header } from '../../../components/controls/typography/typography';
import { localized } from '../../../components/i18n/localized';
import { StylePane } from '../../../components/style-pane/style-pane';
import { UMLElementRepository } from '../../../services/uml-element/uml-element-repository';
import { notEmpty } from '../../../utils/not-empty';
import { ClassElementType } from '../../uml-class-diagram';
import { UMLClassAttribute } from '../../uml-class-diagram/uml-class-attribute/uml-class-attribute';
import { UMLClassMethod } from '../../uml-class-diagram/uml-class-method/uml-class-method';
import { UMLElements } from '../../uml-elements';
import UmlAttributeUpdate from './uml-classifier-attribute-update';
import UmlMethodUpdate from './uml-classifier-method-update';
import { UMLClassifierMember } from './uml-classifier-member';
const Flex = styled.div `
  display: flex;
  align-items: baseline;
  justify-content: space-between;
`;
const InputRow = styled.div `
  display: flex;
  gap: 4px;
  align-items: stretch;
`;
const QuickCodeButton = styled(Button) `
  white-space: nowrap;
  padding: 4px 12px;
  font-size: 12px;
`;
const enhance = compose(localized, connect((state) => ({ elements: state.elements }), {
    create: UMLElementRepository.create,
    update: UMLElementRepository.update,
    delete: UMLElementRepository.delete,
    getById: UMLElementRepository.getById,
}));
const getInitialState = () => ({
    fieldToFocus: undefined,
    colorOpen: false,
});
class ClassifierUpdate extends Component {
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
        this.onFieldChange = (id, values) => {
            this.props.update(id, values);
        };
        this.create = (Clazz) => (value) => {
            const { element, create } = this.props;
            // Prevent method creation for enumerations
            if (element.type === ClassElementType.Enumeration && Clazz === UMLClassMethod) {
                return;
            }
            const member = new Clazz();
            // For attributes, parse the input value and set separate properties
            if (Clazz === UMLClassAttribute) {
                const parsed = UMLClassifierMember.parseNameFormat(value);
                // Use the parsed name (without visibility symbol and type)
                member.name = parsed.name;
                member.visibility = parsed.visibility;
                member.attributeType = parsed.attributeType;
            }
            else {
                member.name = value;
            }
            create(member, element.id);
        };
        this.createMethodWithCode = () => {
            const { element, create } = this.props;
            const method = new UMLClassMethod();
            const methodName = this.newMethodField.current?.props.value || 'new_method';
            method.name = methodName.trim() || '+ new_method()';
            // Add initial code template
            const cleanName = method.name.split('(')[0].replace(/^[+\-#~]\s*/, '').trim() || 'new_method';
            method.code = `def ${cleanName}(self):\n    """Add your docstring here."""\n    # Add your implementation here\n    pass\n`;
            create(method, element.id);
            // Reset the component state by updating the key
            this.setState({ fieldToFocus: this.newMethodField.current });
        };
        this.rename = (id) => (value) => {
            this.props.update(id, { name: value });
        };
        this.toggle = (type) => {
            const { element, update } = this.props;
            const newType = element.type === type ? ClassElementType.Class : type;
            const instance = new UMLElements[newType]({
                id: element.id,
                name: element.name,
                type: element.type,
                owner: element.owner,
                bounds: element.bounds,
                ownedElements: element.ownedElements,
            });
            update(element.id, instance);
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
        const { element, getById, elements } = this.props;
        const children = element.ownedElements.map((id) => getById(id)).filter(notEmpty);
        const attributes = children.filter((child) => child instanceof UMLClassAttribute);
        const methods = children.filter((child) => child instanceof UMLClassMethod);
        const attributeRefs = [];
        const methodRefs = [];
        const isEnumeration = element.type === ClassElementType.Enumeration;
        // Get all enumerations from the current elements state
        const availableEnumerations = Object.values(elements)
            .filter((el) => el.type === ClassElementType.Enumeration)
            .map((el) => ({ value: el.name, label: el.name }));
        return (React.createElement("div", null,
            React.createElement("section", null,
                React.createElement(Flex, null,
                    React.createElement(Textfield, { value: element.name, onChange: this.rename(element.id), autoFocus: true }),
                    React.createElement(ColorButton, { onClick: this.toggleColor }),
                    React.createElement(Button, { color: "link", tabIndex: -1, onClick: this.delete(element.id) },
                        React.createElement(TrashIcon, null))),
                React.createElement(StylePane, { open: this.state.colorOpen, element: element, onColorChange: this.props.update, onFieldChange: this.onFieldChange, showDescription: true, showUri: true, showIcon: true, fillColor: true, lineColor: true, textColor: true }),
                React.createElement(Divider, null)),
            React.createElement("section", null,
                React.createElement(Switch, { value: element.type, onChange: this.toggle, color: "primary" },
                    React.createElement(Switch.Item, { value: ClassElementType.AbstractClass }, this.props.translate('packages.ClassDiagram.AbstractClass')),
                    React.createElement(Switch.Item, { value: ClassElementType.Enumeration }, this.props.translate('packages.ClassDiagram.Enumeration'))),
                React.createElement(Divider, null)),
            React.createElement("section", null,
                React.createElement(Header, null, isEnumeration
                    ? this.props.translate('popup.literals')
                    : this.props.translate('popup.attributes')),
                attributes.map((attribute, index) => {
                    const attrMember = attribute;
                    return (React.createElement(UmlAttributeUpdate, { id: attribute.id, key: attribute.id, value: attribute.name, visibility: attrMember.visibility, attributeType: attrMember.attributeType, onChange: this.props.update, onSubmitKeyUp: () => index === attributes.length - 1
                            ? this.newAttributeField.current?.focus()
                            : this.setState({
                                fieldToFocus: attributeRefs[index + 1],
                            }), onDelete: this.delete, onRefChange: (ref) => (attributeRefs[index] = ref), element: attribute, isEnumeration: isEnumeration, availableEnumerations: availableEnumerations }));
                }),
                React.createElement(Textfield, { ref: this.newAttributeField, outline: true, value: "", placeholder: isEnumeration ? `+ literal` : `+ attribute: str`, onSubmit: this.create(UMLClassAttribute), onSubmitKeyUp: (key, value) => {
                        // if we have a value -> navigate to next field in case we want to create a new element
                        if (value) {
                            this.setState({
                                fieldToFocus: this.newAttributeField.current,
                            });
                        }
                        else if (!isEnumeration) {
                            // Only allow method navigation for non-enumerations
                            if (methodRefs && methodRefs.length > 0) {
                                this.setState({
                                    fieldToFocus: methodRefs[0],
                                });
                            }
                            else {
                                this.setState({
                                    fieldToFocus: this.newMethodField.current,
                                });
                            }
                        }
                    }, onKeyDown: (event) => {
                        // workaround when 'tab' key is pressed:
                        // prevent default and execute blur manually without switching to next tab index
                        // then set focus to newAttributeField field again (componentDidUpdate)
                        if (event.key === 'Tab' && event.currentTarget.value) {
                            event.preventDefault();
                            event.currentTarget.blur();
                            this.setState({
                                fieldToFocus: this.newAttributeField.current,
                            });
                        }
                    } })),
            !isEnumeration && (React.createElement("section", null,
                React.createElement(Divider, null),
                React.createElement(Header, null, this.props.translate('popup.methods')),
                methods.map((method, index) => {
                    const methodMember = method;
                    return (React.createElement(UmlMethodUpdate, { id: method.id, key: method.id, value: method.name, code: methodMember.code || '', onChange: this.props.update, onSubmitKeyUp: () => index === methods.length - 1
                            ? this.newMethodField.current?.focus()
                            : this.setState({
                                fieldToFocus: methodRefs[index + 1],
                            }), onDelete: this.delete, onRefChange: (ref) => (methodRefs[index] = ref), element: method }));
                }),
                React.createElement(InputRow, null,
                    React.createElement(Textfield, { ref: this.newMethodField, outline: true, value: "", placeholder: `+ method(param: str): str or →`, onSubmit: this.create(UMLClassMethod), onSubmitKeyUp: () => this.setState({
                            fieldToFocus: this.newMethodField.current,
                        }), onKeyDown: (event) => {
                            if (event.key === 'Tab' && event.currentTarget.value) {
                                event.preventDefault();
                                event.currentTarget.blur();
                                this.setState({
                                    fieldToFocus: this.newMethodField.current,
                                });
                            }
                        }, style: { flex: 1 } }),
                    React.createElement(QuickCodeButton, { color: "primary", onClick: this.createMethodWithCode, title: "Create method with Python code editor" }, "\uD83D\uDCDD Code"))))));
    }
}
export const UMLClassifierUpdate = enhance(ClassifierUpdate);
//# sourceMappingURL=uml-classifier-update.js.map