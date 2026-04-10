import React, { Component } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { EditorRepository } from '../../services/editor/editor-repository';
import { ApollonMode } from '../../services/editor/editor-types';
import { CreatePane } from '../create-pane/create-pane';
import { localized } from '../i18n/localized';
import { settingsService } from '../../services/settings/settings-service';
import { LayouterRepository } from '../../services/layouter/layouter-repository';
const enhance = compose(localized, connect((state) => {
    return {
        readonly: state.editor.readonly,
        mode: state.editor.mode,
        view: state.editor.view,
        selected: state.selected,
        diagramType: state.diagram.type,
    };
}, {
    changeView: EditorRepository.changeView,
    layout: LayouterRepository.layout,
}));
class SidebarComponent extends Component {
    constructor(props) {
        super(props);
        this.handleSidebarRef = (el) => {
            if (el && this.state.sidebarWidth === 250) {
                // Only set initial width once
                const rect = el.getBoundingClientRect();
                if (rect.width > 150) {
                    el.style.width = 'auto';
                    const autoWidth = el.getBoundingClientRect().width;
                    el.style.width = '';
                    this.setState({ sidebarWidth: autoWidth });
                    el.style.maxWidth = `${Math.min(autoWidth)}px`;
                }
            }
        };
        this.handleResizeMouseDown = (e) => {
            document.body.style.cursor = 'col-resize';
            const startX = e.clientX;
            const startWidth = this.state.sidebarWidth;
            const onMouseMove = (moveEvent) => {
                const newWidth = Math.min(Math.max(startWidth + moveEvent.clientX - startX, 128), 1000);
                this.setState({ sidebarWidth: newWidth });
            };
            const onMouseUp = () => {
                document.body.style.cursor = '';
                const sidebarElement = document.getElementById('modeling-editor-sidebar');
                if (sidebarElement) {
                    const contentWidth = sidebarElement.scrollWidth;
                    if (this.state.sidebarWidth >= contentWidth) {
                        this.setState({ sidebarWidth: contentWidth });
                    }
                }
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);
            };
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        };
        this.toggleInteractiveElementsMode = (event) => {
            const { checked } = event.currentTarget;
            const view = checked ? "Exporting" /* ApollonView.Exporting */ : "Highlight" /* ApollonView.Highlight */;
            this.props.changeView(view);
        };
        this.handleToggleIconMode = () => {
            const newValue = !this.state.showIcon;
            settingsService.updateSetting('showIconView', newValue);
            this.setState({ showIcon: newValue });
            // Force re-render of the entire diagram by triggering a layout refresh
            // This will cause all components to re-render and check their visibility conditions
            this.props.layout();
        };
        this.state = {
            sidebarWidth: 250,
            showIcon: settingsService.shouldShowIconView(),
        };
    }
    render() {
        const { readonly, mode, view, diagramType, translate, changeView } = this.props;
        const { sidebarWidth, showIcon } = this.state;
        const isObjectDiagram = diagramType.includes("Object");
        if (readonly || mode === ApollonMode.Assessment)
            return null;
        // Sidebar content
        const sidebarContent = (React.createElement("div", { id: "modeling-editor-sidebar", "data-cy": "modeling-editor-sidebar", ref: this.handleSidebarRef, style: {
                width: sidebarWidth,
                minWidth: 128,
                maxWidth: 1000,
                resize: 'none',
                overflow: 'auto',
                borderRight: '1px solid #ddd',
            } },
            mode === ApollonMode.Exporting && (React.createElement("div", { className: "dropdown", style: { width: 128 } },
                React.createElement("select", { value: view, onChange: e => changeView(e.target.value), color: "primary" },
                    React.createElement("option", { value: "Modelling" /* ApollonView.Modelling */ }, translate('views.modelling')),
                    React.createElement("option", { value: "Exporting" /* ApollonView.Exporting */ }, translate('views.exporting'))))),
            view === "Modelling" /* ApollonView.Modelling */ ? (React.createElement(React.Fragment, null,
                isObjectDiagram && (React.createElement("label", { htmlFor: "toggleIconMode", style: { display: 'block', marginTop: 8 } },
                    React.createElement("input", { id: "toggleIconMode", type: "checkbox", checked: showIcon, onChange: this.handleToggleIconMode }),
                    "Display Object Diagram in Icon Mode")),
                React.createElement(CreatePane, { key: showIcon ? 'icon' : 'default' }))) : (React.createElement("label", { htmlFor: "toggleInteractiveElementsMode" },
                React.createElement("input", { id: "toggleInteractiveElementsMode", type: "checkbox", checked: view === "Exporting" /* ApollonView.Exporting */, onChange: this.toggleInteractiveElementsMode }),
                translate('views.highlight')))));
        // Resize handle
        const resizeHandle = (React.createElement("div", { style: {
                width: 8,
                cursor: 'ew-resize',
                background: '#eee',
                userSelect: 'none',
            }, onMouseDown: this.handleResizeMouseDown }));
        return (React.createElement("div", { style: { display: 'flex', flexDirection: 'row', height: '100%' } },
            sidebarContent,
            resizeHandle));
    }
}
export const Sidebar = enhance(SidebarComponent);
//# sourceMappingURL=sidebar-component.js.map