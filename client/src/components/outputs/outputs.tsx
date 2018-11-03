import * as _ from 'lodash';
import * as React from 'react';

import { decorators, Treebeard } from 'react-treebeard';
import * as actions from '../../actions/outputs';
import { CODE_EXTENSIONS, IMAGE_EXTENSIONS, TEXT_EXTENSIONS } from '../../constants/extensions';
import { OutputsNode, TreeNode } from '../../models/outputs';
import { OUTPUTS_TREE_STYLE } from './treeViewStyle';

import './outputs.less';

export interface Props {
  outputsTree: { [key: string]: OutputsNode };
  outputsFile: string;
  fetchOutputsTree: (path: string) => actions.OutputsAction;
  fetchOutputsFiles: (path: string) => actions.OutputsAction;
}

export interface State {
  activeNodeId?: string;
  toggledNodeIds: { [key: string]: boolean };
  requestedNodeIds: Set<string>;
  outputsTree: { [key: string]: OutputsNode };
  outputsFile: string;
}

export default class Outputs extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      outputsTree: this.props.outputsTree,
      outputsFile: this.props.outputsFile,
      requestedNodeIds: new Set(),
      activeNodeId: undefined,
      toggledNodeIds: {},
    };
  }

  public componentDidMount() {
    this.props.fetchOutputsTree('');
  }

  public componentDidUpdate(prevProps: Props, prevState: State) {
    if (!_.isEqual(this.props.outputsTree, prevProps.outputsTree) ||
      !_.isEqual(this.props.outputsFile, prevProps.outputsFile)) {
      this.setState({
        ...prevState,
        outputsTree: this.props.outputsTree,
        outputsFile: this.props.outputsFile
      });
    }
  }

  public onToggle = (node: any, toggled: any) => {
    if (node.loading && !this.state.requestedNodeIds.has(node.id)) {
      this.props.fetchOutputsTree(node.id);
    }
    this.setState((prevState, prevProps) => ({
      ...prevState,
      ...{
        toggledNodeIds: {
          ...this.state.toggledNodeIds,
          [node.id]: toggled,
        },
      }
    }));
  };

  public getData = (outputsNode: OutputsNode): TreeNode => {
    const isRoot = outputsNode.isRoot;
    if (isRoot) {
      if (outputsNode.children) {
        const nodes: TreeNode[] = [];
        for (const nodeName of Object.keys(outputsNode.children)) {
          nodes.push(this.getData(outputsNode.children[nodeName]));
        }
        return {children: nodes, toggled: true} as TreeNode;
      }
      // This case should never happen since we should never call this function on an empty root.
      throw Error('unreachable code.');
    }

    const id = outputsNode.path;
    const name = outputsNode.path;
    let toggled;
    let children;
    let active;

    const toggleState = this.state.toggledNodeIds[id];
    if (toggleState) {
      toggled = toggleState;
    }

    if (outputsNode.children) {
      children = [];
      for (const nodeName of Object.keys(outputsNode.children)) {
        children.push(this.getData(outputsNode.children[nodeName]));
      }
    }

    if (this.state.activeNodeId === id) {
      active = true;
    }

    const loading = outputsNode.children !== undefined && !outputsNode.isLoaded;

    return {
      id,
      name,
      toggled,
      children,
      active,
      loading,
    } as TreeNode;
  };

  public getExtension = (path: string) => {
    const parts = path.split(/[./]/);
    return parts[parts.length - 1];
  };

  public render() {
    const nodeHeader = (props: any) => {
      let iconType;
      if (props.node.children) {
        iconType = 'folder';
      } else {
        const extension = this.getExtension(props.node.name);
        if (IMAGE_EXTENSIONS.has(extension)) {
          iconType = 'file-image-o';
        } else if (CODE_EXTENSIONS.has(extension)) {
          iconType = 'file-code-o';
        } else if (TEXT_EXTENSIONS.has(extension)) {
          iconType = 'file-text-o';
        } else {
          iconType = 'file';
        }
      }
      const iconClass = `fa fa-${iconType}`;

      return (
        <div style={props.style.base}>
          <div style={props.style.title}>
            <i className={iconClass}/> {props.node.name}
          </div>
        </div>
      );
    };

    const nodeLoading = (props: any) => {
      return (
        <div style={props.style}>
          <i className="fa fa-refresh"/> loading...
        </div>
      );
    };

    decorators.Header = nodeHeader;
    decorators.Loading = nodeLoading;
    return (
      <div className="outputs">
        <div className="row">
          <div className="col-md-12">
            <div className="outputs-header">
              Outputs
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-md-4">
            {this.state.outputsTree.root
              ? <Treebeard
                data={this.getData(this.state.outputsTree.root)}
                onToggle={this.onToggle}
                style={OUTPUTS_TREE_STYLE}
                decorators={decorators}
              />
              : ''
            }
          </div>
          <div className="col-md-8">
            foo
          </div>
        </div>
      </div>
    );
  }
}
