import React, { Component, ComponentType } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import styled from 'styled-components';
import { UMLRelationship } from '../../services/uml-relationship/uml-relationship';
import { UMLRelationshipRepository } from '../../services/uml-relationship/uml-relationship-repository';
import { UMLElementRepository } from '../../services/uml-element/uml-element-repository';
import { UMLElement } from '../../services/uml-element/uml-element';
import { UMLRelationshipType } from '../uml-relationship-type';
import { AsyncDispatch } from '../../utils/actions/actions';
import { ModelState } from '../../components/store/model-state';
import { localized } from '../../components/i18n/localized';
import { I18nContext } from '../../components/i18n/i18n-context';
import { Divider } from '../../components/controls/divider/divider';
import { Dropdown } from '../../components/controls/dropdown/dropdown';
import { Header } from '../../components/controls/typography/typography';
import { Textfield } from '../../components/controls/textfield/textfield';
import { Button } from '../../components/controls/button/button';
import { TrashIcon } from '../../components/controls/icon/trash';
import { ExchangeIcon } from '../../components/controls/icon/exchange';
import { SwarmRelationshipType, SwarmElementType } from '.';

type OwnProps = {
  element: UMLRelationship;
};

type DispatchProps = {
  update: typeof UMLElementRepository.update;
  delete: typeof UMLElementRepository.delete;
  flip: typeof UMLRelationshipRepository.flip;
  getById: (id: string) => UMLElement | null;
};

type Props = OwnProps & DispatchProps & I18nContext;

const enhance = compose<ComponentType<OwnProps>>(
  localized,
  connect<{}, DispatchProps, OwnProps, ModelState>(null, {
    update: UMLElementRepository.update,
    delete: UMLElementRepository.delete,
    flip: UMLRelationshipRepository.flip,
    getById: UMLElementRepository.getById as any as AsyncDispatch<typeof UMLElementRepository.getById>,
  }),
);

const Flex = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
`;

// Labels for relationship types
const RELATIONSHIP_LABELS: Record<string, string> = {
  [SwarmRelationshipType.SwarmLink]: 'SwarmLink (generic)',
  [SwarmRelationshipType.DelegationLink]: 'DelegationLink (delegation)',
  [SwarmRelationshipType.SupervisionLink]: 'SupervisionLink (supervision)',
};

class SwarmRelationshipUpdateComponent extends Component<Props> {
  /**
   * Get allowed relationship types based on source element
   * Only the source element determines what relationship types can be created
   */
  private getAllowedRelationshipTypes(): string[] {
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

  /**
   * Handle relationship type change
   */
  private onChange = (value: string) => {
    const { element, update } = this.props;
    
    // Get default color for the new type
    const defaultColors: Record<string, string> = {
      [SwarmRelationshipType.DelegationLink]: '#3b82f6',
      [SwarmRelationshipType.SupervisionLink]: '#6b7280',
      [SwarmRelationshipType.SwarmLink]: '#000000',
    };
    
    // Get default name for the new type
    const defaultNames: Record<string, string> = {
      [SwarmRelationshipType.DelegationLink]: 'delegates',
      [SwarmRelationshipType.SupervisionLink]: 'supervises',
      [SwarmRelationshipType.SwarmLink]: '',
    };
    
    update(element.id, { 
      type: value as UMLRelationshipType,
      strokeColor: defaultColors[value] || element.strokeColor,
      name: defaultNames[value] ?? element.name,
    });
  };

  render() {
    const { element, getById, translate } = this.props;
    const source = element.source && getById(element.source.element);
    const target = element.target && getById(element.target.element);
    
    if (!source || !target) return null;
    // Get allowed types based on source element
    const allowedTypes = this.getAllowedRelationshipTypes();

    return (
      <div>
        <section>
          <Flex>
            <Header gutter={false} style={{ flexGrow: 1 }}>
              Relationship
            </Header>
            <Button color="link" onClick={() => this.props.flip(element.id)}>
              <ExchangeIcon />
            </Button>
            <Button color="link" onClick={() => this.props.delete(element.id)}>
              <TrashIcon />
            </Button>
          </Flex>
          <Divider />
        </section>

        <section>
          <Flex>
            <span style={{ marginRight: '0.5em' }}>Name:</span>
            <Textfield
              value={element.name}
              onChange={(value) => this.props.update(element.id, { name: value })}
              placeholder="Relationship name"
            />
          </Flex>
          <Divider />
        </section>

        <section>
          {/* Only show dropdown if more than one type is allowed */}
          {allowedTypes.length > 1 ? (
            <Dropdown value={element.type} onChange={this.onChange}>
              {allowedTypes.map(relType => (
                <Dropdown.Item key={relType} value={relType}>
                  {RELATIONSHIP_LABELS[relType] || relType}
                </Dropdown.Item>
              ))}
            </Dropdown>
          ) : (
            <span style={{ fontStyle: 'italic', color: '#666' }}>
              Type: {RELATIONSHIP_LABELS[element.type] || element.type}
            </span>
          )}
        </section>
      </div>
    );
  }
}

export const SwarmRelationshipUpdate = enhance(SwarmRelationshipUpdateComponent);