import React, { Component, ComponentClass } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { Button } from '../../../components/controls/button/button';
import { Divider } from '../../../components/controls/divider/divider';
import { TrashIcon } from '../../../components/controls/icon/trash';
import { Textfield } from '../../../components/controls/textfield/textfield';
import { I18nContext } from '../../../components/i18n/i18n-context';
import { localized } from '../../../components/i18n/localized';
import { ModelState } from '../../../components/store/model-state';
import { styled } from '../../../components/theme/styles';
import { UMLElementRepository } from '../../../services/uml-element/uml-element-repository';
import { AGENTIC_ELIGIBLE_GATEWAY_TYPES, BPMNGateway, BPMNGatewayType } from './bpmn-gateway';
import { BPMNFlow } from '../bpmn-flow/bpmn-flow';
import { findDownstreamAgenticConstructs, resolveUpstreamCollabMode } from '../bpmn-flow/bpmn-flow-validator';
import { BPMNTask } from '../bpmn-task/bpmn-task';
import { Dropdown } from '../../../components/controls/dropdown/dropdown';
import { ColorButton } from '../../../components/controls/color-button/color-button';
import { StylePane } from '../../../components/style-pane/style-pane';
import { Switch } from '../../../components/controls/switch/switch';
import {
  BPMNCollaborationMode,
  BPMNGatewayRole,
  BPMNMergingStrategy,
  clampTrustScore,
  mergingStrategiesFor,
} from '../common/types';

// BPMN 2.0.2 § 8.3.13 / §§ 10.5.4 / 10.5.6: Parallel and Event-Based gateways
// cannot carry a default outgoing sequence flow.
const NO_DEFAULT_GATEWAY_TYPES: ReadonlySet<BPMNGatewayType> = new Set<BPMNGatewayType>(['parallel', 'event-based']);

// Map merging-strategy enum values to their i18n keys. Centralised so the
// popup and any future strategy-rendering code stay aligned.
const strategyKey = (s: BPMNMergingStrategy): string => {
  switch (s) {
    case 'majority':
      return 'BPMNStrategyMajority';
    case 'absolute-majority':
      return 'BPMNStrategyAbsoluteMajority';
    case 'minority':
      return 'BPMNStrategyMinority';
    case 'leader-driven':
      return 'BPMNStrategyLeaderDriven';
    case 'composed':
      return 'BPMNStrategyComposed';
    case 'fastest':
      return 'BPMNStrategyFastest';
    case 'most-complete':
      return 'BPMNStrategyMostComplete';
  }
};

// Map collaboration-mode enum values to their i18n keys (04D2-followup F2 —
// used by the read-only "inherited" label on merging gateways + agentic tasks).
const collabKey = (m: BPMNCollaborationMode): string => {
  switch (m) {
    case 'voting':
      return 'BPMNCollabVoting';
    case 'role':
      return 'BPMNCollabRole';
    case 'debate':
      return 'BPMNCollabDebate';
    case 'competition':
      return 'BPMNCollabCompetition';
  }
};

interface OwnProps {
  element: BPMNGateway;
}

type StateProps = {
  // IDs of outgoing default sequence flows from this gateway. Cleared by
  // `changeGatewayType` when the user switches to a type that may not carry
  // a default flow (Parallel / Event-Based per BPMN 2.0.2 § 8.3.13).
  outgoingDefaultFlowIds: string[];
  // 04D2-followup F-D1: collaboration mode inherited from the nearest upstream
  // agentic diverging gateway. Drives the read-only "inherited" label on
  // merging gateways and the role-dropdown gating (no merging without upstream).
  derivedUpstreamMode: BPMNCollaborationMode | undefined;
  // 04D2-followup F-D5: snapshot of the unified element + relationship map so
  // `changeCollaborationMode` can forward-walk downstream constructs on edit.
  elementsById: Record<string, { id: string; type: string }>;
};

interface DispatchProps {
  update: typeof UMLElementRepository.update;
  delete: typeof UMLElementRepository.delete;
}

type Props = OwnProps & StateProps & DispatchProps & I18nContext;

const enhance = compose<ComponentClass<OwnProps>>(
  localized,
  connect<StateProps, DispatchProps, OwnProps, ModelState>(
    (state, ownProps) => {
      const myId = ownProps.element.id;
      const outgoingDefaultFlowIds = Object.values(state.elements)
        .filter((e) => {
          const f = e as unknown as Partial<BPMNFlow>;
          if (f.flowType !== 'sequence' || f.isDefault !== true) return false;
          const r = e as unknown as { source?: { element: string } };
          return r.source?.element === myId;
        })
        .map((e) => e.id);
      const elementsById = state.elements as unknown as Record<string, { id: string; type: string }>;
      const derivedUpstreamMode = resolveUpstreamCollabMode(myId, elementsById);
      return { outgoingDefaultFlowIds, derivedUpstreamMode, elementsById };
    },
    {
      update: UMLElementRepository.update,
      delete: UMLElementRepository.delete,
    },
  ),
);

const Flex = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
`;

type State = { colorOpen: boolean };

class BPMNGatewayUpdateComponent extends Component<Props, State> {
  state = { colorOpen: false };

  private toggleColor = () => {
    this.setState((state) => ({
      colorOpen: !state.colorOpen,
    }));
  };

  render() {
    const { element } = this.props;

    return (
      <div>
        <section>
          <Flex>
            <Textfield value={element.name} onChange={this.rename(element.id)} autoFocus />
            <ColorButton onClick={this.toggleColor} />
            <Button color="link" tabIndex={-1} onClick={this.delete(element.id)}>
              <TrashIcon />
            </Button>
          </Flex>
          <Divider />
        </section>
        <section>
          <StylePane
            open={this.state.colorOpen}
            element={element}
            onColorChange={this.props.update}
            lineColor
            textColor
            fillColor
          />
        </section>
        <section>
          <Dropdown value={element.gatewayType} onChange={this.changeGatewayType(element.id)}>
            <Dropdown.Item value={'exclusive'}>
              {this.props.translate('packages.BPMN.BPMNExclusiveGateway')}
            </Dropdown.Item>
            <Dropdown.Item value={'parallel'}>
              {this.props.translate('packages.BPMN.BPMNParallelGateway')}
            </Dropdown.Item>
            <Dropdown.Item value={'inclusive'}>
              {this.props.translate('packages.BPMN.BPMNInclusiveGateway')}
            </Dropdown.Item>
            <Dropdown.Item value={'event-based'}>
              {this.props.translate('packages.BPMN.BPMNEventBasedGateway')}
            </Dropdown.Item>
            <Dropdown.Item value={'complex'}>{this.props.translate('packages.BPMN.BPMNComplexGateway')}</Dropdown.Item>
          </Dropdown>
        </section>
        {/* Agentic BPMN (04D1): only Parallel + Inclusive gateways are eligible
            (paper §4.3 — Exclusive excluded; Complex / Event-Based not in the
            paper). Toggle reveals the role / mode / strategy / trust fields. */}
        {AGENTIC_ELIGIBLE_GATEWAY_TYPES.has(element.gatewayType) && (
          <>
            <section>
              <Divider />
              <Switch
                value={element.isAgentic ? 'agentic' : ''}
                onChange={this.toggleAgentic(element.id)}
                color="primary"
              >
                <Switch.Item value={'agentic'}>{this.props.translate('packages.BPMN.BPMNAgentic')}</Switch.Item>
              </Switch>
            </section>
            {element.isAgentic && (
              <>
                <section>
                  <Divider />
                  {/* 04D2-followup F-D2: hide the `merging` role option when no
                      upstream agentic diverging gateway exists. Prevents users
                      from creating an orphaned merging gateway. */}
                  <Dropdown value={element.gatewayRole} onChange={this.changeGatewayRole(element.id)}>
                    {[
                      <Dropdown.Item key="diverging" value={'diverging'}>
                        {this.props.translate('packages.BPMN.BPMNGatewayRoleDiverging')}
                      </Dropdown.Item>,
                      ...(this.props.derivedUpstreamMode !== undefined || element.gatewayRole === 'merging'
                        ? [
                            <Dropdown.Item key="merging" value={'merging'}>
                              {this.props.translate('packages.BPMN.BPMNGatewayRoleMerging')}
                            </Dropdown.Item>,
                          ]
                        : []),
                    ]}
                  </Dropdown>
                </section>
                {/* 04D2-followup F-D3: merging gateway shows the inherited
                    collaboration mode read-only; diverging keeps the dropdown. */}
                <section>
                  <Divider />
                  {element.gatewayRole === 'merging' ? (
                    <Flex>
                      <span>{this.props.translate('packages.BPMN.BPMNCollaborationModeInheritedLabel')}</span>
                      <span>
                        {this.props.derivedUpstreamMode
                          ? this.props.translate(`packages.BPMN.${collabKey(this.props.derivedUpstreamMode)}`)
                          : this.props.translate('packages.BPMN.BPMNInheritedNone')}
                      </span>
                    </Flex>
                  ) : (
                    <Dropdown value={element.collaborationMode} onChange={this.changeCollaborationMode(element.id)}>
                      <Dropdown.Item value={'voting'}>
                        {this.props.translate('packages.BPMN.BPMNCollabVoting')}
                      </Dropdown.Item>
                      <Dropdown.Item value={'role'}>
                        {this.props.translate('packages.BPMN.BPMNCollabRole')}
                      </Dropdown.Item>
                      <Dropdown.Item value={'debate'}>
                        {this.props.translate('packages.BPMN.BPMNCollabDebate')}
                      </Dropdown.Item>
                      <Dropdown.Item value={'competition'}>
                        {this.props.translate('packages.BPMN.BPMNCollabCompetition')}
                      </Dropdown.Item>
                    </Dropdown>
                  )}
                </section>
                {element.gatewayRole === 'merging' && (
                  <section>
                    <Divider />
                    {/* F-D3: filter strategies by the *inherited* mode, not
                        the stored one — keeps the list valid even when the
                        stored field is briefly stale after an upstream edit. */}
                    <Dropdown value={element.mergingStrategy} onChange={this.changeMergingStrategy(element.id)}>
                      {mergingStrategiesFor(this.props.derivedUpstreamMode ?? element.collaborationMode).map((s) => (
                        <Dropdown.Item key={s} value={s}>
                          {this.props.translate(`packages.BPMN.${strategyKey(s)}`)}
                        </Dropdown.Item>
                      ))}
                    </Dropdown>
                  </section>
                )}
                <section>
                  <Divider />
                  <Flex>
                    <span>{this.props.translate('packages.BPMN.BPMNTrustScore')}</span>
                    <Textfield value={String(element.trustScore)} onChange={this.changeTrustScore(element.id)} />
                  </Flex>
                </section>
              </>
            )}
          </>
        )}
      </div>
    );
  }

  /**
   * Rename the gateway
   * @param id The ID of the gateway that should be renamed
   */
  private rename = (id: string) => (value: string) => {
    this.props.update(id, { name: value });
  };

  /**
   * Change the type of the gateway. If the new type cannot carry a default
   * flow (Parallel / Event-Based per BPMN 2.0.2 § 8.3.13), clear `isDefault`
   * on every outgoing sequence flow first. If the new type is not agentic-
   * eligible (Exclusive / Complex / Event-Based per 04D1), clear `isAgentic`.
   * @param id The ID of the gateway whose type should be changed
   */
  private changeGatewayType = (id: string) => (value: string) => {
    const newType = value as BPMNGatewayType;
    if (NO_DEFAULT_GATEWAY_TYPES.has(newType)) {
      for (const flowId of this.props.outgoingDefaultFlowIds) {
        this.props.update<BPMNFlow>(flowId, { isDefault: false });
      }
    }
    const patch: Partial<BPMNGateway> = { gatewayType: newType };
    if (!AGENTIC_ELIGIBLE_GATEWAY_TYPES.has(newType) && this.props.element.isAgentic) {
      patch.isAgentic = false;
    }
    this.props.update<BPMNGateway>(id, patch);
  };

  /**
   * Toggle whether the gateway is agentic (04D1).
   */
  private toggleAgentic = (id: string) => (_value: string) => {
    this.props.update<BPMNGateway>(id, { isAgentic: !this.props.element.isAgentic });
  };

  /**
   * Change the gateway role (diverging / merging — D-D2).
   */
  private changeGatewayRole = (id: string) => (value: string) => {
    this.props.update<BPMNGateway>(id, { gatewayRole: value as BPMNGatewayRole });
  };

  /**
   * Change the collaboration mode. Always snap `mergingStrategy` to the first
   * valid value of the new mode — even when the current strategy would still
   * be valid (e.g. `majority` is valid for both voting and debate). Snapping
   * unconditionally keeps the merging marker visually in sync with the mode
   * the user picked. Trade-off documented in the 04D1 guide (debate's first
   * valid strategy is `majority` → still renders as `v-ma`, ambiguous; the
   * diverging gateway's `d` marker disambiguates the cooperation type).
   *
   * 04D2-followup F-D5: when the gateway is diverging, also propagate the new
   * mode to every reachable downstream agentic task + merging gateway (forward
   * BFS, stops at nested diverging gateways). Keeps the model field consistent
   * with the derived value so the canvas, the exporter, and reopened popups
   * all see the same truth.
   */
  private changeCollaborationMode = (id: string) => (value: string) => {
    const newMode = value as BPMNCollaborationMode;
    const newStrategy = mergingStrategiesFor(newMode)[0];
    this.props.update<BPMNGateway>(id, { collaborationMode: newMode, mergingStrategy: newStrategy });
    if (this.props.element.gatewayRole !== 'diverging') return;
    const { taskIds, mergingGatewayIds } = findDownstreamAgenticConstructs(id, this.props.elementsById);
    for (const taskId of taskIds) {
      this.props.update<BPMNTask>(taskId, { collaborationMode: newMode });
    }
    for (const gwId of mergingGatewayIds) {
      this.props.update<BPMNGateway>(gwId, { collaborationMode: newMode, mergingStrategy: newStrategy });
    }
  };

  /**
   * Change the merging strategy.
   */
  private changeMergingStrategy = (id: string) => (value: string) => {
    this.props.update<BPMNGateway>(id, { mergingStrategy: value as BPMNMergingStrategy });
  };

  /**
   * Change the trust score, clamped to 0–100.
   */
  private changeTrustScore = (id: string) => (value: string) => {
    const parsed = Number.parseInt(value, 10);
    this.props.update<BPMNGateway>(id, { trustScore: clampTrustScore(Number.isFinite(parsed) ? parsed : 0) });
  };

  /**
   * Delete a gateway
   * @param id The ID of the gateway that should be deleted
   */
  private delete = (id: string) => () => {
    this.props.delete(id);
  };
}

export const BPMNGatewayUpdate = enhance(BPMNGatewayUpdateComponent);
