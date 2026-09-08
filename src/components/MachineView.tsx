import { useState } from 'react'
import type { PDA } from '../core/pda/types'
import { transitionLabel } from './pdaEditorLayout'
import { FluidMachineGraph } from './FluidMachineGraph'

interface MachineViewProps {
  machine: PDA
  activeState: string
  activeTransitionId?: string | null
  animationKey?: string | number
}

export function MachineView({ machine, activeState, activeTransitionId, animationKey }: MachineViewProps) {
  const [zoom, setZoom] = useState(1)
  const activeTransition = machine.transitions.find((transition) => transition.id === activeTransitionId)

  return (
    <section className="panel machine-panel">
      <div className="panel-heading machine-heading">
        <div><span>PDA</span><span className="heading-separator">/</span><span>FLUID STATE GRAPH</span></div>
        <div className="machine-tools" role="group" aria-label="Graph zoom controls">
          <button type="button" onClick={() => setZoom((value) => Math.max(.78, value - .12))} aria-label="Zoom out">−</button>
          <button type="button" className="zoom-readout" onClick={() => setZoom(1)}>{Math.round(zoom * 100)}%</button>
          <button type="button" onClick={() => setZoom((value) => Math.min(1.35, value + .12))} aria-label="Zoom in">+</button>
        </div>
      </div>

      <div className="machine-canvas" role="region" aria-label="PDA state graph" tabIndex={0}>
        <div className="graph-watermark">LIVE MACHINE · CANVAS 60 FPS</div>
        <FluidMachineGraph
          machine={machine}
          activeState={activeState}
          activeTransitionId={activeTransitionId}
          animationKey={animationKey}
          zoom={zoom}
        />

        <div className="graph-telemetry" aria-live="polite">
          <span className="live-dot" />
          <div>
            <small>ACTIVE TRANSITION</small>
            <strong>{activeTransition ? transitionLabel(activeTransition) : 'Waiting for step'}</strong>
          </div>
        </div>
      </div>
    </section>
  )
}
