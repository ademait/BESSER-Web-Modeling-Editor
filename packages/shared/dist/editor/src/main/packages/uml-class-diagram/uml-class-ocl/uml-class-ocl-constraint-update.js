import React, { Component } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { Button } from '../../../components/controls/button/button';
import { ColorButton } from '../../../components/controls/color-button/color-button';
import { TrashIcon } from '../../../components/controls/icon/trash';
import { localized } from '../../../components/i18n/localized';
import { StylePane } from '../../../components/style-pane/style-pane';
import { styled } from '../../../components/theme/styles';
import { UMLElementRepository } from '../../../services/uml-element/uml-element-repository';
const Flex = styled.div `
  display: flex;
  flex-direction: column;
  gap: 8px;
`;
const ButtonRow = styled.div `
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: flex-end;
`;
const StyledTextarea = styled.textarea `
  font-family: inherit;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 4px;
  resize: both;
  min-width: 200px;
  min-height: 100px;
  height: 150px;
  line-height: 1.4;
  max-width: 100%;
  max-height: 100%;
  overflow: auto;
  padding: 8px;
`;
class ClassOCLConstraintUpdateComponent extends Component {
    constructor() {
        super(...arguments);
        this.state = { colorOpen: false };
        this.toggleColor = () => {
            this.setState((state) => ({
                colorOpen: !state.colorOpen,
            }));
        };
        this.onUpdate = (constraint) => {
            const { element, update } = this.props;
            const currentBounds = element.bounds;
            update(element.id, {
                constraint,
                bounds: {
                    ...currentBounds,
                    // Keep existing width/height if manually resized
                    width: currentBounds.width,
                    height: currentBounds.height
                }
            });
        };
    }
    render() {
        const { element } = this.props;
        return (React.createElement("div", null,
            React.createElement("section", null,
                React.createElement(Flex, null,
                    React.createElement(StyledTextarea, { value: element.constraint || '', placeholder: this.props.translate('packages.OCLConstraint.Constraint'), onChange: (e) => this.onUpdate(e.target.value), autoFocus: true }),
                    React.createElement(ButtonRow, null,
                        React.createElement(ColorButton, { onClick: this.toggleColor }),
                        React.createElement(Button, { color: "link", tabIndex: -1, onClick: () => this.props.delete(element.id) },
                            React.createElement(TrashIcon, null))))),
            React.createElement(StylePane, { open: this.state.colorOpen, element: element, onColorChange: this.props.update, lineColor: true, textColor: true, fillColor: true })));
    }
}
const enhance = compose(localized, connect(null, {
    update: UMLElementRepository.update,
    delete: UMLElementRepository.delete,
}));
export const ClassOCLConstraintUpdate = enhance(ClassOCLConstraintUpdateComponent);
//# sourceMappingURL=uml-class-ocl-constraint-update.js.map