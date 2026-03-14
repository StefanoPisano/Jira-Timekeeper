
const Footer = () => {

    return (
        <>
            <div className={"absolute bottom-0 left-[40px]"}>
                <div className={"mt-2.5 font-mono text-xs text-center"}>
                    Developed by <a className={"underline"} href={"https://stefanopisano.github.io/"}>Stefano Pisano</a><br/>
                    Source code is under<br/><a className={"underline"} href={"../LICENSE"}>Apache License 2.0.</a><br/>
                    © {new Date().getFullYear()}
                </div>
            </div>
        </>
    )
}

export default Footer