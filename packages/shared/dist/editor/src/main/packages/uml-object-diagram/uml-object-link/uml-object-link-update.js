import React, { Component } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { Button } from '../../../components/controls/button/button';
import { ColorButton } from '../../../components/controls/color-button/color-button';
import { Divider } from '../../../components/controls/divider/divider';
import { Dropdown } from '../../../components/controls/dropdown/dropdown';
import { ExchangeIcon } from '../../../components/controls/icon/exchange';
import { TrashIcon } from '../../../components/controls/icon/trash';
import { Textfield } from '../../../components/controls/textfield/textfield';
import { Body, Header } from '../../../components/controls/typography/typography';
import { localized } from '../../../components/i18n/localized';
import { StylePane } from '../../../components/style-pane/style-pane';
import { styled } from '../../../components/theme/styles';
import { UMLElementRepository } from '../../../services/uml-element/uml-element-repository';
import { UMLRelationshipRepository } from '../../../services/uml-relationship/uml-relationship-repository';
import { diagramBridge } from '../../../services/diagram-bridge';
const Flex = styled.div `
  display: flex;
  align-items: baseline;
  justify-content: space-between;
`;
const AssociationSelectionFlex = styled.div `
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
`;
class ObjectLinkUpdate extends Component {
    constructor() {
        super(...arguments);
        this.state = { colorOpen: false };
        this.toggleColor = () => {
            this.setState((state) => ({
                colorOpen: !state.colorOpen,
            }));
        };
        this.getAvailableAssociations = () => {
            const { element, getById } = this.props;
            const sourceElement = element.source && getById(element.source.element);
            const targetElement = element.target && getById(element.target.element);
            if (!sourceElement || !targetElement)
                return [];
            // Get class IDs directly from the connected objects (they are ObjectName elements)
            const sourceClassId = sourceElement.classId;
            const targetClassId = targetElement.classId;
            if (!sourceClassId || !targetClassId) {
                return [];
            }
            // Use diagram bridge service to get associations
            return diagramBridge.getAvailableAssociations(sourceClassId, targetClassId);
        };
        this.onAssociationChange = (associationId) => {
            const availableAssociations = this.getAvailableAssociations();
            const selectedAssociation = availableAssociations.find(assoc => assoc.id === associationId);
            const updateData = {};
            if (selectedAssociation) {
                // Use the association's actual name or generate display name as the link name
                const displayName = this.getRelationshipDisplayName(selectedAssociation, this.props.getById(this.props.element.source?.element), this.props.getById(this.props.element.target?.element));
                updateData.name = selectedAssociation.name || displayName;
                updateData.associationId = selectedAssociation.id;
            }
            else {
                // No association selected
                updateData.name = this.props.element.name || ''; // Keep existing name
                updateData.associationId = undefined;
            }
            this.props.update(this.props.element.id, updateData);
        };
        this.getSelectedAssociationId = () => {
            return this.props.element.associationId || '';
        };
        this.getRelationshipDisplayName = (relationship, sourceObject, targetObject) => {
            return diagramBridge.getRelationshipDisplayName(relationship, sourceObject?.name || 'Object', targetObject?.name || 'Object');
        };
    }
    render() {
        const { element, getById } = this.props;
        const source = element.source && getById(element.source.element);
        const target = element.target && getById(element.target.element);
        if (!source || !target)
            return null;
        const availableAssociations = this.getAvailableAssociations();
        const selectedAssociationId = this.getSelectedAssociationId();
        return (React.createElement("div", null,
            React.createElement("section", null,
                React.createElement(Flex, null,
                    React.createElement(Header, { gutter: false, style: { flexGrow: 1 } }, this.props.translate('popup.objectLink')),
                    React.createElement(ColorButton, { onClick: this.toggleColor }),
                    React.createElement(Button, { color: "link", onClick: () => this.props.flip(element.id) },
                        React.createElement(ExchangeIcon, null)),
                    React.createElement(Button, { color: "link", onClick: () => this.props.delete(element.id) },
                        React.createElement(TrashIcon, null))),
                React.createElement(StylePane, { open: this.state.colorOpen, element: element, onColorChange: this.props.update, lineColor: true, textColor: true }),
                React.createElement(Divider, null)),
            React.createElement("section", null,
                React.createElement(Header, null,
                    this.props.translate('popup.linkDetails'),
                    " (",
                    React.createElement("small", null,
                        source.name,
                        " \u27F6 ",
                        target.name),
                    ")"),
                React.createElement(Flex, null,
                    React.createElement(Body, { style: { marginRight: '0.5em' } }, this.props.translate('popup.name')),
                    React.createElement(Textfield, { value: element.name || '', onChange: (value) => this.props.update(element.id, { name: value }), placeholder: "Link name" })),
                availableAssociations.length > 0 && (React.createElement(AssociationSelectionFlex, null,
                    React.createElement(Body, null, this.props.translate('popup.association')),
                    "              ",
                    React.createElement(Dropdown, { value: selectedAssociationId || '', onChange: this.onAssociationChange }, [
                        React.createElement(Dropdown.Item, { key: "empty", value: "" }, this.props.translate('popup.noAssociation')),
                        ...availableAssociations.map((association) => {
                            const displayName = this.getRelationshipDisplayName(association, source, target);
                            return (React.createElement(Dropdown.Item, { key: association.id, value: association.id }, displayName));
                        })
                    ]))),
                availableAssociations.length === 0 && (React.createElement("div", { style: { marginTop: '8px', fontSize: '12px', color: '#999', fontStyle: 'italic' } }, this.props.translate('popup.noAssociationsAvailable'))))));
    }
}
const enhance = compose(localized, connect(null, {
    update: UMLElementRepository.update,
    delete: UMLElementRepository.delete,
    flip: UMLRelationshipRepository.flip,
    getById: UMLElementRepository.getById,
}));
export const UMLObjectLinkUpdate = enhance(ObjectLinkUpdate);
//# sourceMappingURL=uml-object-link-update.js.map