import { internalProperty, LitElement, property } from "lit-element";
import { html, TemplateResult } from "lit-html";

import { fireEvent } from "../common/dom/fire_event";
import type { HASSDomEvent } from "../common/dom/fire_event";
import type { ActionConfig } from "../data/lovelace";
import type { Constructor, HomeAssistant } from "../types";
import type {
  EditSubElementEvent,
  SubElementEditorConfig,
} from "../panels/lovelace/editor/types";

import "../panels/lovelace/editor/hui-sub-element-editor";
import "../panels/lovelace/editor/action-editor/hui-actions-editor";

export const ActionEditorMixin = <T extends Constructor<LitElement>>(
  superClass: T
) => {
  class ActionEditorBase extends superClass {
    @property({ attribute: false }) public hass?: HomeAssistant;

    @internalProperty() protected _config?: any;

    @internalProperty()
    protected _subElementEditorConfig?: SubElementEditorConfig;

    get _tap_action(): ActionConfig {
      return this._config!.tap_action || { action: "toggle" };
    }

    get _hold_action(): ActionConfig {
      return this._config!.hold_action || { action: "more-info" };
    }

    get _double_tap_action(): ActionConfig {
      return this._config!.double_tap_action || { action: "none" };
    }

    private _editDetailElement(ev: HASSDomEvent<EditSubElementEvent>): void {
      this._subElementEditorConfig = ev.detail.subElementConfig;
    }

    protected _updateAction(ev: CustomEvent): void {
      const config = ev.detail.config as ActionConfig;

      if (this[`_${ev.detail.type}`] === config) {
        return;
      }

      const newConfig = { ...this._config };

      if (config === undefined) {
        delete newConfig[ev.detail.type];
      } else {
        newConfig[ev.detail.type] = config;
      }

      fireEvent(this, "config-changed", { config: newConfig });
    }

    protected _goBack(): void {
      this._subElementEditorConfig = undefined;
    }

    protected _handleActionConfigChanged(ev: CustomEvent): void {
      ev.stopPropagation();
      console.log("_handleActionConfigChanged");
      if (!this._config || !this.hass) {
        return;
      }

      const configValue = this._subElementEditorConfig?.type;
      const config = ev.detail.config as ActionConfig;

      console.log("configValue: " + configValue);
      console.log("config: " + config);

      if (this[`_${configValue}`] === config) {
        return;
      }

      if (configValue) {
        this._config = {
          ...this._config!,
          [configValue]: config,
        };
      }

      this._subElementEditorConfig = {
        ...this._subElementEditorConfig!,
        elementConfig: config,
      };

      fireEvent(this, "config-changed", { config: this._config });
    }

    protected _renderDetailEditorBase(): TemplateResult {
      return html`
        <hui-sub-element-editor
          .hass=${this.hass}
          .config=${this._subElementEditorConfig!}
          @go-back=${this._goBack}
          @config-changed=${this._handleActionConfigChanged}
        >
        </hui-sub-element-editor>
      `;
    }

    protected _renderActionsEditor(): TemplateResult {
      return html`<hui-actions-editor
        .hass=${this.hass}
        .tapAction=${this._tap_action}
        .holdAction=${this._hold_action}
        .doubleTapAction=${this._double_tap_action}
        .tooltipText=${this.hass!.localize(
          "ui.panel.lovelace.editor.card.button.default_action_help"
        )}
        @update-action=${this._updateAction}
        @edit-detail-element=${this._editDetailElement}
      ></hui-actions-editor>`;
    }
  }
  return ActionEditorBase;
};
