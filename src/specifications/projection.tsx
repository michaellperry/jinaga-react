import * as React from "react";
import { FieldDeclaration, WatchContext } from "./declaration";
import { Mapping } from "./mapping";
import { StorePath, getStoreItem, combineStorePath } from "../store/store";
import { JinagaContext } from "../components/JinagaContext";
import { Preposition, Watch } from "jinaga";

/**
 * Set up a child component.
 * The child inherits the context from the current component.
 * It starts from the same fact.
 * 
 * The associated property is a render function for the child.
 * Pass any additional props that the child component requires, not defined by the mapping specification, to this function.
 * 
 * It's best to give this property a capitalized name.
 * That allows you to render the child naturally within the parent component.
 * 
 * @param mapping A specification mapping for the client component.
 */
export function projection<M, VM extends {}, P>(
    mapping: Mapping<M, VM, P>
): FieldDeclaration<M, (props: P) => JSX.Element> {
    const PresentationComponent = mapping.PresentationComponent;

    interface ProjectionContainerProps {
        path: StorePath;
        passThrough: P;
    }

    class ProjectionContainer extends React.Component<ProjectionContainerProps> {
        static contextType = JinagaContext;
        context!: React.ContextType<typeof JinagaContext>

        constructor(props: ProjectionContainerProps) {
            super(props);
        }

        render() {
            const storeItem = getStoreItem(this.context, this.props.path);
            const vm = storeItem ? mapping.getMappingValue(storeItem) : null;
            return vm
                ? <PresentationComponent {...{...vm, ...this.props.passThrough}} />
                : <></>;
        }
    }

    return {
        initialFieldState: (m, path, fieldName) => props => {
            const childPath = combineStorePath(path, fieldName, "");
            return <ProjectionContainer path={childPath} passThrough={props} />;
        },
        initialFieldItems: (m, path, fieldName) => {
            const childPath = combineStorePath(path, fieldName, "");
            return [{
                hash: "",
                data: mapping.initialMappingState(m, childPath),
                orderBy: null,
                items: mapping.initialMappingItems(m, childPath)
            }]
        },
        getFieldValue: (store, fieldName) => store.data[fieldName],
        createFieldWatches: (beginWatch, mutator, fieldName) => {
            function beginChildWatch<U>(
                preposition: Preposition<M, U>,
                resultAdded: (path: StorePath, child: U) => WatchContext
            ): Watch<U, WatchContext> {
                function childResultAdded(path: StorePath, child: U): WatchContext {
                    const childPath = combineStorePath(path, fieldName, "");
                    return resultAdded(childPath, child);
                }
                const watch = beginWatch(preposition, childResultAdded);
                return watch;
            }
            const watches = mapping.createMappingWatches(beginChildWatch, mutator);
            return watches;
        }
    };
}
