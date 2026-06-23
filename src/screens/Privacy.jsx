import InfoPage from "../components/InfoPage.jsx";
import { PRIVACY_MD } from "../content/legal.js";

export default function Privacy() {
  return <InfoPage title="Privacy" source={PRIVACY_MD} />;
}
