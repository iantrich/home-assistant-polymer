import "@polymer/paper-input/paper-input";
import {
  CSSResult,
  customElement,
  html,
  LitElement,
  TemplateResult,
} from "lit-element";
import { assert, boolean, object, optional, string } from "superstruct";

import { fireEvent } from "../../../../common/dom/fire_event";
import { stateIcon } from "../../../../common/entity/state_icon";
import { computeRTLDirection } from "../../../../common/util/compute_rtl";
import { ActionEditorMixin } from "../../../../mixins/action-editor-mixin";
import { actionConfigStruct } from "../types";
import { configElementStyle } from "./config-elements-style";

import type { ButtonCardConfig } from "../../cards/types";
import type { LovelaceCardEditor } from "../../types";
import type { EditorTarget } from "../types";

import "../action-editor/hui-action-editor";
import "../../components/hui-entity-editor";
import "../../components/hui-theme-select-editor";
import "../../../../components/ha-formfield";
import "../../../../components/ha-icon-input";
import "../../../../components/ha-switch";

const cardConfigStruct = object({
  type: string(),
  entity: optional(string()),
  name: optional(string()),
  show_name: optional(boolean()),
  icon: optional(string()),
  show_icon: optional(boolean()),
  icon_height: optional(string()),
  tap_action: optional(actionConfigStruct),
  hold_action: optional(actionConfigStruct),
  double_tap_action: optional(actionConfigStruct),
  theme: optional(string()),
  show_state: optional(boolean()),
});

@customElement("hui-button-card-editor")
export class HuiButtonCardEditor extends ActionEditorMixin(LitElement)
  implements LovelaceCardEditor {
  public setConfig(config: ButtonCardConfig): void {
    assert(config, cardConfigStruct);
    this._config = config;
  }

  get _entity(): string {
    return this._config!.entity || "";
  }

  get _name(): string {
    return this._config!.name || "";
  }

  get _show_name(): boolean {
    return this._config!.show_name ?? true;
  }

  get _show_state(): boolean {
    return this._config!.show_state ?? false;
  }

  get _icon(): string {
    return this._config!.icon || "";
  }

  get _show_icon(): boolean {
    return this._config!.show_icon ?? true;
  }

  get _icon_height(): string {
    return this._config!.icon_height && this._config!.icon_height.includes("px")
      ? String(parseFloat(this._config!.icon_height))
      : "";
  }

  get _theme(): string {
    return this._config!.theme || "";
  }

  protected render(): TemplateResult {
    if (!this.hass || !this._config) {
      return html``;
    }

    const dir = computeRTLDirection(this.hass!);

    if (this._subElementEditorConfig) {
      return this._renderDetailEditorBase();
    }

    return html`
      <div class="card-config">
        <ha-entity-picker
          .label="${this.hass.localize(
            "ui.panel.lovelace.editor.card.generic.entity"
          )} (${this.hass.localize(
            "ui.panel.lovelace.editor.card.config.optional"
          )})"
          .hass=${this.hass}
          .value=${this._entity}
          .configValue=${"entity"}
          @value-changed=${this._valueChanged}
          allow-custom-entity
        ></ha-entity-picker>
        <div class="side-by-side">
          <paper-input
            .label="${this.hass.localize(
              "ui.panel.lovelace.editor.card.generic.name"
            )} (${this.hass.localize(
              "ui.panel.lovelace.editor.card.config.optional"
            )})"
            .value=${this._name}
            .configValue=${"name"}
            @value-changed=${this._valueChanged}
          ></paper-input>
          <ha-icon-input
            .label="${this.hass.localize(
              "ui.panel.lovelace.editor.card.generic.icon"
            )} (${this.hass.localize(
              "ui.panel.lovelace.editor.card.config.optional"
            )})"
            .value=${this._icon}
            .placeholder=${this._icon ||
            stateIcon(this.hass.states[this._entity])}
            .configValue=${"icon"}
            @value-changed=${this._valueChanged}
          ></ha-icon-input>
        </div>
        <div class="side-by-side">
          <div>
            <ha-formfield
              .label=${this.hass.localize(
                "ui.panel.lovelace.editor.card.generic.show_name"
              )}
              .dir=${dir}
            >
              <ha-switch
                .checked=${this._show_name !== false}
                .configValue=${"show_name"}
                @change=${this._change}
              ></ha-switch>
            </ha-formfield>
          </div>
          <div>
            <ha-formfield
              .label=${this.hass.localize(
                "ui.panel.lovelace.editor.card.generic.show_state"
              )}
              .dir=${dir}
            >
              <ha-switch
                .checked=${this._show_state !== false}
                .configValue=${"show_state"}
                @change=${this._change}
              ></ha-switch>
            </ha-formfield>
          </div>
          <div>
            <ha-formfield
              .label=${this.hass.localize(
                "ui.panel.lovelace.editor.card.generic.show_icon"
              )}
              .dir=${dir}
            >
              <ha-switch
                .checked=${this._show_icon !== false}
                .configValue=${"show_icon"}
                @change=${this._change}
              ></ha-switch>
            </ha-formfield>
          </div>
        </div>
        <div class="side-by-side">
          <paper-input
            .label="${this.hass.localize(
              "ui.panel.lovelace.editor.card.generic.icon_height"
            )} (${this.hass.localize(
              "ui.panel.lovelace.editor.card.config.optional"
            )})"
            .value=${this._icon_height}
            .configValue=${"icon_height"}
            @value-changed=${this._valueChanged}
            type="number"
            ><div class="suffix" slot="suffix">px</div>
          </paper-input>
          <hui-theme-select-editor
            .hass=${this.hass}
            .value=${this._theme}
            .configValue=${"theme"}
            @value-changed=${this._valueChanged}
          ></hui-theme-select-editor>
        </div>
        ${this._renderActionsEditor()}
      </div>
    `;
  }

  private _change(ev: Event) {
    if (!this._config || !this.hass) {
      return;
    }
    const target = ev.target! as EditorTarget;
    const value = target.checked;

    if (this[`_${target.configValue}`] === value) {
      return;
    }

    fireEvent(this, "config-changed", {
      config: {
        ...this._config,
        [target.configValue!]: value,
      },
    });
  }

  private _valueChanged(ev: CustomEvent): void {
    if (!this._config || !this.hass) {
      return;
    }
    const target = ev.target! as EditorTarget;
    const value = ev.detail.value;

    if (this[`_${target.configValue}`] === value) {
      return;
    }
    let newConfig;
    if (target.configValue) {
      if (value !== false && !value) {
        newConfig = { ...this._config };
        delete newConfig[target.configValue!];
      } else {
        newConfig = {
          ...this._config,
          [target.configValue!]:
            target.configValue === "icon_height" && !isNaN(Number(target.value))
              ? `${String(value)}px`
              : value,
        };
      }
    }

    fireEvent(this, "config-changed", { config: newConfig });
  }

  static get styles(): CSSResult {
    return configElementStyle;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "hui-button-card-editor": HuiButtonCardEditor;
  }
}
