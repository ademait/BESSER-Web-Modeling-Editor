import React, { Component } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { Textfield } from '../../../components/controls/textfield/textfield';
import { Dropdown } from '../../../components/controls/dropdown/dropdown'; // For enums
import { Button } from '../../../components/controls/button/button';
import { TrashIcon } from '../../../components/controls/icon/trash';
import { Divider } from '../../../components/controls/divider/divider';
import { styled } from '../../../components/theme/styles';
import { UMLElementRepository } from '../../../services/uml-element/uml-element-repository';
const Flex = styled.div `
  display: flex;
  align-items: baseline;
  justify-content: space-between;
`;
const enhance = compose(connect(null, {
    update: UMLElementRepository.update,
    delete: UMLElementRepository.delete,
}));
class SwarmUpdateComponent extends Component {
    constructor() {
        super(...arguments);
        this.changeFramework = (id) => (value) => {
            const updateData = { framework: value };
            this.props.update(id, updateData);
        };
        this.rename = (id) => (value) => {
            this.props.update(id, { name: value });
        };
        this.delete = (id) => () => {
            this.props.delete(id);
        };
    }
    render() {
        const { element } = this.props;
        return (React.createElement("div", null,
            React.createElement("section", null,
                React.createElement(Flex, null,
                    React.createElement(Textfield, { value: element.name, onChange: this.rename(element.id), autoFocus: true }),
                    React.createElement(Button, { color: "link", tabIndex: -1, onClick: this.delete(element.id) },
                        React.createElement(TrashIcon, null))),
                React.createElement(Divider, null)),
            React.createElement("section", null,
                React.createElement(Dropdown, { value: element.framework, onChange: this.changeFramework(element.id) },
                    React.createElement(Dropdown.Item, { value: "BESSER-BAF" }, "BESSER-BAF")))));
    }
}
export const SwarmUpdate = enhance(SwarmUpdateComponent);
//# sourceMappingURL=swarm-update.js.map