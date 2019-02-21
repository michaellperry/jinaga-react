import { Preposition, Watch } from "jinaga";

export type ViewModelPath<Parent, Id> = {
    parent: Parent,
    id: Id
};

export type BeginWatch<Model, ChildModel, Parent, Path> = (
    preposition: Preposition<Model, ChildModel>,
    resultAdded: (parent: Parent, child: ChildModel) => Path,
    resultRemoved: (path: Path) => void
) => Watch<ChildModel, Path>;

export type Transformer<ViewModel> = (oldViewModel: ViewModel) => ViewModel;

export type Mutator<Path, ViewModel> = (path: Path, transformer: Transformer<ViewModel>) => void;

export interface FieldSpecificationComplete<Model, ViewModel, ChildModel, Parent, Path> {
    initialize(m: Model, vm: ViewModel): ViewModel;
    createWatch(
        beginWatch: BeginWatch<Model, ChildModel, Parent, Path>,
        mutator: Mutator<Parent, ViewModel>
    ) : Watch<ChildModel, Parent>[]
};

export type FieldSpecification<Model, ViewModel> = FieldSpecificationComplete<Model, ViewModel, any, any, any>;