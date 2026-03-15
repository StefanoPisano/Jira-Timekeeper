
const Footer = () => {

    return (
        <>
            <div className={"absolute bottom-0 left-[40px]"}>
                <div className={"mt-2.5 font-mono text-xs text-center"}>
                </div>
                Developed by <a className={"underline"} href={"https://stefanopisano.github.io/"}>Stefano
                Pisano</a><br/>
                Source code is under <a className={"underline"} href={"../LICENSE"}>MIT License.</a><br/>
                © {new Date().getFullYear()}
            </div>
        </>
    )
}

export default Footer