import React, { Component } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import styled from 'styled-components';
import { UMLRelationshipRepository } from '../../services/uml-relationship/uml-relationship-repository';
import { UMLElementRepository } from '../../services/uml-element/uml-element-repository';
import { localized } from '../../components/i18n/localized';
import { Divider } from '../../components/controls/divider/divider';
import { Dropdown } from '../../components/controls/dropdown/dropdown';
import { Header } from '../../components/controls/typography/typography';
import { Textfield } from '../../components/controls/textfield/textfield';
import { Button } from '../../components/controls/button/button';
import { TrashIcon } from '../../components/controls/icon/trash';
import { ExchangeIcon } from '../../components/controls/icon/exchange';
import { SwarmRelationshipType, SwarmElementType } from '.';
const enhance = compose(localized, connect(null, {
    update: UMLElementRepository.update,
    delete: UMLElementRepository.delete,
    flip: UMLRelationshipRepository.flip,
    getById: UMLElementRepository.getById,
}));
const Flex = styled.div `
  display: flex;
  align-items: baseline;
  justify-content: space-between;
`;
// Labels for relationship types
const RELATIONSHIP_LABELS = {
    [SwarmRelationshipType.SwarmLink]: 'SwarmLink (generic)',
    [SwarmRelationshipType.DelegationLink]: 'DelegationLink (delegation)',
    [SwarmRelationshipType.SupervisionLink]: 'SupervisionLink (supervision)',
};
class SwarmRelationshipUpdateComponent extends Component {
    constructor() {
        super(...arguments);
        /**
         * Handle relationship type change
         */
        this.onChange = (value) => {
            const { element, update } = this.props;
            // Get default color for the new type
            const defaultColors = {
                [SwarmRelationshipType.DelegationLink]: '#3b82f6',
                [SwarmRelationshipType.SupervisionLink]: '#6b7280',
                [SwarmRelationshipType.SwarmLink]: '#000000',
            };
            // Get default name for the new type
            const defaultNames = {
                [SwarmRelationshipType.DelegationLink]: 'delegates',
                [SwarmRelationshipType.SupervisionLink]: 'supervises',
                [SwarmRelationshipType.SwarmLink]: '',
            };
            update(element.id, {
                type: value,
                strokeColor: defaultColors[value] || element.strokeColor,
                name: defaultNames[value] ?? element.name,
            });
        };
    }
    /**
     * Get allowed relationship types based on source element
     * Only the source element determines what relationship types can be created
     */
    getAllowedRelationshipTypes() {
        const { element, getById } = this.props;
        const source = element.source && getById(element.source.element);
        if (!source) {
            // Fallback: only SwarmLink (safest option)
            return [SwarmRelationshipType.SwarmLink];
        }
        // Strict rules based on source element type
        switch (source.type) {
            case SwarmElementType.Dispatcher:
                // Only Dispatcher can create DelegationLink
                return [
                    SwarmRelationshipType.DelegationLink,
                    SwarmRelationshipType.SwarmLink,
                ];
            case SwarmElementType.Supervisor:
                // Only Supervisor can create SupervisionLink
                return [
                    SwarmRelationshipType.SupervisionLink,
                    SwarmRelationshipType.SwarmLink,
                ];
            // All other element types can ONLY create SwarmLink
            case SwarmElementType.Solver:
            case SwarmElementType.Evaluator:
            case SwarmElementType.AgentGroup:
            case SwarmElementType.Swarm:
            case SwarmElementType.LanguageModel:
            default:
                return [SwarmRelationshipType.SwarmLink];
        }
    }
    render() {
        const { element, getById, translate } = this.props;
        const source = element.source && getById(element.source.element);
        const target = element.target && getById(element.target.element);
        if (!source || !target)
            return null;
        // Get allowed types based on source element
        const allowedTypes = this.getAllowedRelationshipTypes();
        return (React.createElement("div", null,
            React.createElement("section", null,
                React.createElement(Flex, null,
                    React.createElement(Header, { gutter: false, style: { flexGrow: 1 } }, "Relationship"),
                    React.createElement(Button, { color: "link", onClick: () => this.props.flip(element.id) },
                        React.createElement(ExchangeIcon, null)),
                    React.createElement(Button, { color: "link", onClick: () => this.props.delete(element.id) },
                        React.createElement(TrashIcon, null))),
                React.createElement(Divider, null)),
            React.createElement("section", null,
                React.createElement(Flex, null,
                    React.createElement("span", { style: { marginRight: '0.5em' } }, "Name:"),
                    React.createElement(Textfield, { value: element.name, onChange: (value) => this.props.update(element.id, { name: value }), placeholder: "Relationship name" })),
                React.createElement(Divider, null)),
            React.createElement("section", null, allowedTypes.length > 1 ? (React.createElement(Dropdown, { value: element.type, onChange: this.onChange }, allowedTypes.map(relType => (React.createElement(Dropdown.Item, { key: relType, value: relType }, RELATIONSHIP_LABELS[relType] || relType))))) : (React.createElement("span", { style: { fontStyle: 'italic', color: '#666' } },
                "Type: ",
                RELATIONSHIP_LABELS[element.type] || element.type)))));
    }
}
export const SwarmRelationshipUpdate = enhance(SwarmRelationshipUpdateComponent);
//# sourceMappingURL=swarm-relationship-update.js.map