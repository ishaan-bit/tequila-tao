import InfoPage from "../components/InfoPage.jsx";
import { GUIDE_MD } from "../content/legal.js";

export default function Guide() {
  return <InfoPage title="How it works" source={GUIDE_MD} />;
}
