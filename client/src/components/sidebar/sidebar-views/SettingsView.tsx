import Select from "@/components/common/Select"
import { useSettings } from "@/context/SettingContext"
import useResponsive from "@/hooks/useResponsive"
import { editorFonts } from "@/resources/Fonts"
import { editorThemes } from "@/resources/Themes"
import { langNames } from "@uiw/codemirror-extensions-langs"
import { ChangeEvent, useEffect } from "react"

function SettingsView() {
    const {
        theme,
        setTheme,
        language,
        setLanguage,
        fontSize,
        setFontSize,
        fontFamily,
        setFontFamily,
        resetSettings,
    } = useSettings()
    const { viewHeight } = useResponsive()

    const handleFontFamilyChange = (e: ChangeEvent<HTMLSelectElement>) =>
        setFontFamily(e.target.value)
    const handleThemeChange = (e: ChangeEvent<HTMLSelectElement>) =>
        setTheme(e.target.value)
    const handleLanguageChange = (e: ChangeEvent<HTMLSelectElement>) =>
        setLanguage(e.target.value)
    const handleFontSizeChange = (e: ChangeEvent<HTMLSelectElement>) =>
        setFontSize(parseInt(e.target.value))


    useEffect(() => {
        // Set editor font family
        const editor = document.querySelector(
            ".cm-editor > .cm-scroller",
        ) as HTMLElement
        if (editor !== null) {
            editor.style.fontFamily = `${fontFamily}, monospace`
        }
    }, [fontFamily])

    return (
        <div
            className="flex flex-col items-center gap-4 p-4 overflow-auto custom-scrollbar"
            style={{ height: viewHeight }}
        >
            <h1 className="view-title">Settings</h1>
            {/* Choose Font Family option */}
            <div className="flex w-full items-end gap-2">
                <div className="flex-grow">
                    <Select
                        onChange={handleFontFamilyChange}
                        value={fontFamily}
                        options={editorFonts}
                        title="Font Family"
                    />
                </div>
                {/* Choose font size option */}
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-white/50 ml-1 uppercase">Size</label>
                    <select
                        value={fontSize}
                        onChange={handleFontSizeChange}
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none transition-all focus:border-primary/50 focus:bg-white/10"
                        title="Font Size"
                    >
                        {[...Array(13).keys()].map((size) => {
                            return (
                                <option key={size} value={size + 12} className="bg-dark">
                                    {size + 12}
                                </option>
                            )
                        })}
                    </select>
                </div>
            </div>
            {/* Choose theme option */}
            <div className="w-full">
                <Select
                    onChange={handleThemeChange}
                    value={theme}
                    options={Object.keys(editorThemes)}
                    title="Theme"
                />
            </div>
            {/* Choose language option */}
            <div className="w-full">
                <Select
                    onChange={handleLanguageChange}
                    value={language}
                    options={langNames}
                    title="Language"
                />
            </div>
            <button
                className="btn-primary mt-auto w-full !bg-none !bg-white/5 !text-white/70 hover:!bg-white/10 hover:!text-white border border-white/5"
                onClick={resetSettings}
            >
                Reset to default
            </button>
        </div>
    )
}

export default SettingsView
