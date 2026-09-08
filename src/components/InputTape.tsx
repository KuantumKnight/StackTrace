interface InputTapeProps {
  input: string
  inputIndex: number
}

export function InputTape({ input, inputIndex }: InputTapeProps) {
  const symbols = input.length ? [...input] : ['ε']

  return (
    <section className="input-tape" aria-label="Input tape">
      <div className="tape-label-row">
        <span>Input</span>
        <span>{Math.min(inputIndex, input.length)} / {input.length} consumed</span>
      </div>
      <div className="tape-track">
        <div className="tape-cells">
          {symbols.map((symbol, index) => {
            const consumed = input.length > 0 && index < inputIndex
            const current = input.length > 0 && index === inputIndex
            return (
              <div className={`tape-cell ${consumed ? 'consumed' : ''} ${current ? 'current' : ''}`} key={`${symbol}-${index}`}>
                {current && <span className="read-head" aria-hidden="true">▼</span>}
                <span>{symbol}</span>
                <small>{index}</small>
              </div>
            )
          })}
          {inputIndex >= input.length && input.length > 0 && (
            <div className="tape-cell end-marker current"><span className="read-head" aria-hidden="true">▼</span><span>ε</span><small>End</small></div>
          )}
        </div>
      </div>
    </section>
  )
}
