/****************************************************************************
 ** @license
 ** This demo file is part of yFiles for HTML 2.1.
 ** Copyright (c) 2000-2018 by yWorks GmbH, Vor dem Kreuzberg 28,
 ** 72070 Tuebingen, Germany. All rights reserved.
 **
 ** yFiles demo files exhibit yFiles for HTML functionalities. Any redistribution
 ** of demo files in source code or binary form, with or without
 ** modification, is not permitted.
 **
 ** Owners of a valid software license for a yFiles for HTML version that this
 ** demo is shipped with are allowed to use the demo source code as basis
 ** for their own yFiles for HTML powered applications. Use of such programs is
 ** governed by the rights and conditions as set out in the yFiles for HTML
 ** license agreement.
 **
 ** THIS SOFTWARE IS PROVIDED ''AS IS'' AND ANY EXPRESS OR IMPLIED
 ** WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 ** MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN
 ** NO EVENT SHALL yWorks BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 ** SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
 ** TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 ** PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 ** LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 ** NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 ** SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 **
 ***************************************************************************/
'use strict'

define(['yfiles/view-editor', 'NodePlacerPanel.js'], (
  /** @type {yfiles_namespace} */ /** typeof yfiles */ yfiles,
  NodePlacerPanel
) => {
  /**
   * An {@link yfiles.input.IInputMode} which creates an edge along with a target node when dragging on an unselected
   * node. This will keep the tree-structure of the graph intact.
   */
  class CreateTreeEdgeInputMode extends yfiles.input.CreateEdgeInputMode {
    /**
     * Creates a new instance of this input mode.
     */
    constructor() {
      super()
      this.targetNode = null

      // edge creation can end anytime because the target node is also created by this input mode
      this.endHitTestable = yfiles.input.IHitTestable.ALWAYS
      // this input mode doesn't create bends
      this.validBendHitTestable = yfiles.input.IHitTestable.NEVER
    }

    /**
     * Creates the dummy edge and the dummy node that are used as a preview during edge creation.
     * @return {yfiles.graph.IEdge}
     */
    createDummyEdge() {
      const dummyEdge = super.createDummyEdge()

      // create a target node
      this.targetNode = new yfiles.graph.SimpleNode()

      return dummyEdge
    }

    /**
     * Adds the visualization for the target node when the edge creation gesture started.
     * @param {yfiles.input.EdgeEventArgs} event
     */
    onEdgeCreationStarted(event) {
      super.onEdgeCreationStarted(event)

      if (this.targetNode) {
        // only create a target node visualization when there is an actual source node
        const sourceNode = this.getSource(this.startPoint)
        if (sourceNode) {
          this.targetNode.layout = yfiles.geometry.Rect.fromCenter(
            this.dummyEdge.sourcePort.location,
            new yfiles.geometry.Size(60, 30)
          )

          // initialize style so it matches the other nodes in this new layer
          this.targetNode.tag = { layer: sourceNode.tag.layer + 1 }
          this.targetNode.style = new yfiles.styles.ShapeNodeStyle({
            shape: yfiles.styles.ShapeNodeShape.ROUND_RECTANGLE,
            stroke: 'white',
            fill:
              NodePlacerPanel.layerFills[
                this.targetNode.tag.layer % NodePlacerPanel.layerFills.length
              ]
          })

          // do not show a target indicator, it is obvious that the new node will be the target
          this.targetNode.lookupImplementation = yfiles.graph.ILookup.createCascadingLookup(
            this.targetNode.lookupImplementation,
            yfiles.graph.ILookup.createSingleLookup(
              new yfiles.view.NodeStyleDecorationInstaller({
                nodeStyle: yfiles.styles.VoidNodeStyle.INSTANCE
              }),
              yfiles.view.IHighlightIndicatorInstaller.$class
            )
          )

          // visualize the dummy node in the input mode group
          const inputModeGroup = this.inputModeContext.canvasComponent.inputModeGroup
          this.canvasObject = inputModeGroup.addChild(
            this.targetNode.style.renderer.getVisualCreator(this.targetNode, this.targetNode.style),
            yfiles.view.ICanvasObjectDescriptor.ALWAYS_DIRTY_INSTANCE
          )
        }
      }
    }

    /**
     * Updates the target location and the position of the dummy node.
     * @param {yfiles.geometry.Point} location
     */
    updateTargetLocation(location) {
      super.updateTargetLocation(location)
      if (this.targetNode) {
        this.targetNode.layout = yfiles.geometry.Rect.fromCenter(
          location,
          this.targetNode.layout.toSize()
        )
      }
    }

    /**
     * Returns the current dummy node since it is always the target for the created edge.
     * @param {yfiles.geometry.Point} location The location is ignored in this implementation.
     * @return {yfiles.graph.INode}
     */
    getTarget(location) {
      return this.targetNode
    }

    /**
     * Creates the actual edge and target node after edge creation is finished.
     * @return {yfiles.graph.IEdge}
     */
    createEdge() {
      const graph = this.inputModeContext.graph

      // create the target node
      const node = graph.createNode(
        this.targetNode.layout,
        this.targetNode.style,
        this.targetNode.tag
      )

      // clean up the dummy node visualization
      this.canvasObject.remove()
      this.canvasObject = null
      this.targetNode = null

      // create the edge
      const edge = super.createEdge(
        graph,
        this.sourcePortCandidate,
        new yfiles.input.DefaultPortCandidate(
          node,
          yfiles.graph.FreeNodePortLocationModel.NODE_CENTER_ANCHORED
        )
      )

      // fire edge created event
      this.onEdgeCreated(new yfiles.graph.EdgeEventArgs(edge))
      return edge
    }

    /**
     * Cleans up after edge creation is canceled.
     */
    onCanceled() {
      super.onCanceled()

      // clean up the dummy node visualization
      this.targetNode = null
      if (this.canvasObject) {
        this.canvasObject.remove()
        this.canvasObject = null
      }
    }
  }

  return CreateTreeEdgeInputMode
})