import React, { Component } from 'react';
import { StereotypeOnIcon } from '../icon/stereotype-on';
import { StereotypeOffIcon } from '../icon/stereotype-off';
import { Button } from '../button/button';
export class StereotypeToggle extends Component {
    render() {
        const { value, onChange } = this.props;
        return (React.createElement(Button, { color: "link", tabIndex: -1, onClick: onChange }, value ? React.createElement(StereotypeOnIcon, null) : React.createElement(StereotypeOffIcon, null)));
    }
}
//# sourceMappingURL=stereotype-toggle.js.map