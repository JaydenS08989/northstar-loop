import type React from "react";
import { LoaderCircle } from "lucide-react";
const Spinner: React.FC = () => <LoaderCircle className="size-5 animate-spin" aria-label="Loading" />;
export default Spinner;
