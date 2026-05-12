import { ChangeEvent } from "react"
import { PiCaretDownBold } from "react-icons/pi"

interface SelectProps {
    onChange: (e: ChangeEvent<HTMLSelectElement>) => void
    value: string
    options: string[]
    title: string
}

function Select({ onChange, value, options, title }: SelectProps) {
    return (
        <div className="relative flex w-full flex-col gap-2">
            <label className="text-xs font-semibold text-white/50 ml-1 uppercase">{title}</label>
            <div className="relative">
                <select
                    className="input-field appearance-none pr-10 text-sm"
                    value={value}
                    onChange={onChange}
                >
                    {options.sort().map((option) => {
                        const value = option
                        const name =
                            option.charAt(0).toUpperCase() + option.slice(1)

                        return (
                            <option key={name} value={value} className="bg-dark">
                                {name}
                            </option>
                        )
                    })}
                </select>
                <PiCaretDownBold
                    size={14}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/50"
                />
            </div>
        </div>
    )
}

export default Select
