import packageJson from '../../../package.json';

const Footer = () => {

    return (
        <div className={"pt-10 pm-10 font-mono text-xs text-center"}>
            <span className={"block md:inline"}>Developed by <a className={"underline"} href={"https://stefanopisano.github.io/"}>Stefano
                Pisano</a></span> <span className={"hidden md:inline"}>|</span> <span className={"block md:inline"}>Images by <a className={"underline"} href={"https://www.linkedin.com/in/biancabizzozero"}>Bianca Bizzozero</a></span><br/>
            Source code under <a className={"underline"} href={"../LICENSE"}>GNU General Public License v3.0</a><br />
            © {new Date().getFullYear()}<br />
            <strong>Version {packageJson.version}</strong>
        </div>
    )
}

export default Footer