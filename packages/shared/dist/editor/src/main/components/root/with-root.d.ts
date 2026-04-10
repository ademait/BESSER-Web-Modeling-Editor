import React, { Component, ComponentType } from 'react';
import { RootContext } from './root-context';
export declare const withRoot: <P extends RootContext, C extends Component>(WrappedComponent: ComponentType<P>) => React.ForwardRefExoticComponent<React.PropsWithoutRef<Pick<P, Exclude<keyof P, "root">>> & React.RefAttributes<C>>;
