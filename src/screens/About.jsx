import InfoPage from "../components/InfoPage.jsx";
import { ABOUT_MD } from "../content/legal.js";

export default function About() {
  return <InfoPage title="About" source={ABOUT_MD} />;
}
