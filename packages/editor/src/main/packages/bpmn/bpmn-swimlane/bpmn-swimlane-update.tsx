import React, { Component, ComponentClass } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { Button } from '../../../components/controls/button/button';
import { Divider } from '../../../components/controls/divider/divider';
import { Dropdown } from '../../../components/controls/dropdown/dropdown';
import { Switch } from '../../../components/controls/switch/switch';
import { TrashIcon } from '../../../components/controls/icon/trash';
import { Textfield } from '../../../components/controls/textfield/textfield';
import { I18nContext } from '../../../components/i18n/i18n-context';
import { localized } from '../../../components/i18n/localized';
import { ModelState } from '../../../components/store/model-state';
import { styled } from '../../../components/theme/styles';
import { UMLElementRepository } from '../../../services/uml-element/uml-element-repository';
import { UMLElementActionTypes } from '../../../services/uml-element/uml-element-types';
import { LayouterRepository } from '../../../services/layouter/layouter-repository';
import { ColorButton } from '../../../components/controls/color-button/color-button';
import { StylePane } from '../../../components/style-pane/style-pane';
import { BPMNElementType } from '..';
import { IUMLContainer, UMLContainer } from '../../../services/uml-container/uml-container';
import { BPMNSwimlane } from './bpmn-swimlane';
import { BPMNAgentRole, clampTrustScore, clampMultiplicity } from '../common/types';
import { AgentDiagramLinkSection } from '../../../components/agent-diagram-linker/AgentDiagramLinkSection';

interface OwnProps {
  element: BPMNSwimlane;
}
interface StateProps {
  prevLaneId: string | null;
  nextLaneId: string | null;
  prevLaneBounds: { x: number; y: number; width: number; height: number } | null;
  nextLaneBounds: { x: number; y: number; width: number; height: number } | null;
}
type IBounds = { x: number; y: number; width: number; height: number };
interface DispatchProps {
  update: typeof UMLElementRepository.update;
  delete: typeof UMLElementRepository.delete;
  swapLaneBounds: (idA: string, boundsA: IBounds, idB: string, boundsB: IBounds) => void;
}
type Props = OwnProps & StateProps & DispatchProps & I18nContext;

const mapStateToProps = (state: ModelState, ownProps: OwnProps): StateProps => {
  const { element } = ownProps;
  const empty: StateProps = { prevLaneId: null, nextLaneId: null, prevLaneBounds: null, nextLaneBounds: null };
  if (!element.owner) return empty;
  const owner = state.elements[element.owner];
  if (!owner || !UMLContainer.isUMLContainer(owner)) return empty;
  const sortedLanes = (owner as IUMLContainer).ownedElements
    .map((id) => state.elements[id])
    .filter((el) => !!el && el.type === BPMNElementType.BPMNSwimlane)
    .sort((a, b) => a.bounds.y - b.bounds.y);
  const idx = sortedLanes.findIndex((lane) => lane.id === element.id);
  if (idx === -1) return empty;
  const prev = idx > 0 ? sortedLanes[idx - 1] : null;
  const next = idx < sortedLanes.length - 1 ? sortedLanes[idx + 1] : null;
  return {
    prevLaneId: prev ? prev.id : null,
    prevLaneBounds: prev ? prev.bounds : null,
    nextLaneId: next ? next.id : null,
    nextLaneBounds: next ? next.bounds : null,
  };
};

const enhance = compose<ComponentClass<OwnProps>>(
  localized,
  connect<StateProps, DispatchProps, OwnProps, ModelState>(
    mapStateToProps,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (dispatch: any) => ({
      update: (id: any, values: any) => dispatch(UMLElementRepository.update(id, values)),
      delete: (id?: any) => dispatch(UMLElementRepository.delete(id)),
      swapLaneBounds: (idA: string, boundsA: IBounds, idB: string, boundsB: IBounds) => {
        dispatch({
          type: UMLElementActionTypes.UPDATE,
          payload: { values: [{ id: idA, bounds: boundsA }, { id: idB, bounds: boundsB }] },
          undoable: false,
        });
        dispatch(LayouterRepository.layout());
      },
    }),
  ),
);

const Flex = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
`;

type State = { colorOpen: boolean };

// Agentic BPMN (04D): a lane is a plain BPMNSwimlane; the "Agentic" toggle marks
// it as an agentic lane and reveals the role / trust-score fields.
class BPMNSwimlaneUpdateComponent extends Component<Props, State> {
  state = { colorOpen: false };

  private toggleColor = () => this.setState((s) => ({ colorOpen: !s.colorOpen }));

  render() {
    const { element } = this.props;
    return (
      <div>
        <section>
          <Flex>
            <Textfield value={element.name} onChange={this.rename(element.id)} autoFocus />
            <Button color="link" tabIndex={-1} onClick={this.moveUp} disabled={this.props.prevLaneId === null}>
              ▲
            </Button>
            <Button color="link" tabIndex={-1} onClick={this.moveDown} disabled={this.props.nextLaneId === null}>
              ▼
            </Button>
            <ColorButton onClick={this.toggleColor} />
            <Button color="link" tabIndex={-1} onClick={this.delete(element.id)}>
              <TrashIcon />
            </Button>
          </Flex>
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
          <Divider />
          <Switch value={element.isAgentic ? 'agentic' : ''} onChange={this.toggleAgentic(element.id)} color="primary">
            <Switch.Item value={'agentic'}>{this.props.translate('packages.BPMNDiagram.BPMNAgentic')}</Switch.Item>
          </Switch>
        </section>
        {element.isAgentic && (
          <>
            <section>
              <Divider />
              <Dropdown value={element.role} onChange={this.changeRole(element.id)}>
                <Dropdown.Item value={'worker'}>
                  {this.props.translate('packages.BPMNDiagram.BPMNAgentRoleWorker')}
                </Dropdown.Item>
                <Dropdown.Item value={'manager'}>
                  {this.props.translate('packages.BPMNDiagram.BPMNAgentRoleManager')}
                </Dropdown.Item>
              </Dropdown>
            </section>
            <section>
              <Divider />
              <Flex>
                <span>{this.props.translate('packages.BPMNDiagram.BPMNTrustScore')}</span>
                <Textfield value={String(element.trustScore)} onChange={this.changeTrustScore(element.id)} />
              </Flex>
            </section>
            <section>
              <Divider />
              <Flex>
                <span>{this.props.translate('packages.BPMNDiagram.BPMNMultiplicity')}</span>
                <Textfield value={String(element.multiplicity)} onChange={this.changeMultiplicity(element.id)} />
              </Flex>
            </section>
            {/* 29 (4a) — re-mount the lane → Agent-diagram link (reverses guide 11's
                lane-UI removal; the model/XML round-trip was never removed). The
                section is element-agnostic — the `laneId`/`laneName` prop names are
                the original 08 names; here they carry the lane's id/name. Clicking
                Define runs the populating derivation (Step 3 wiring). */}
            <AgentDiagramLinkSection
              laneId={element.id}
              laneName={element.name}
              agentDiagramRef={element.agentDiagramRef}
            />
          </>
        )}
      </div>
    );
  }

  private moveUp = () => {
    const { element, prevLaneId, prevLaneBounds } = this.props;
    if (!prevLaneId || !prevLaneBounds) return;
    this.props.swapLaneBounds(
      element.id, { ...element.bounds, y: prevLaneBounds.y },
      prevLaneId, { ...prevLaneBounds, y: element.bounds.y },
    );
  };

  private moveDown = () => {
    const { element, nextLaneId, nextLaneBounds } = this.props;
    if (!nextLaneId || !nextLaneBounds) return;
    this.props.swapLaneBounds(
      element.id, { ...element.bounds, y: nextLaneBounds.y },
      nextLaneId, { ...nextLaneBounds, y: element.bounds.y },
    );
  };

  private rename = (id: string) => (value: string) => this.props.update(id, { name: value });

  private toggleAgentic = (id: string) => (_value: string) => {
    this.props.update<BPMNSwimlane>(id, { isAgentic: !this.props.element.isAgentic });
  };

  private changeRole = (id: string) => (value: string) => {
    this.props.update<BPMNSwimlane>(id, { role: value as BPMNAgentRole });
  };

  private changeTrustScore = (id: string) => (value: string) => {
    const parsed = Number.parseInt(value, 10);
    this.props.update<BPMNSwimlane>(id, { trustScore: clampTrustScore(Number.isFinite(parsed) ? parsed : 0) });
  };

  private changeMultiplicity = (id: string) => (value: string) => {
    const parsed = Number.parseInt(value, 10);
    this.props.update<BPMNSwimlane>(id, { multiplicity: clampMultiplicity(Number.isFinite(parsed) ? parsed : 1) });
  };

  private delete = (id: string) => () => this.props.delete(id);
}

export const BPMNSwimlaneUpdate = enhance(BPMNSwimlaneUpdateComponent);
