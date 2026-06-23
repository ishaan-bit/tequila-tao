import InfoPage from "../components/InfoPage.jsx";
import { TERMS_MD } from "../content/legal.js";

export default function Terms() {
  return <InfoPage title="Terms & care" source={TERMS_MD} />;
}
