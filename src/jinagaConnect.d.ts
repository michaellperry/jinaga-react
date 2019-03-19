import { Component } from 'react';
import { Jinaga } from 'jinaga';

import { FieldSpecification } from "./specifications";

export interface JinagaConnectConfig<Model, ViewModel> {
  specs: FieldSpecification<Model, ViewModel>[],
  model: Model,
}
export function connectJinaga<Model, ViewModel>(setup: (j: Jinaga) => JinagaConnectConfig<Model, ViewModel>): <T extends Component<any, any, any>>(wrappedComponent: T) => T;