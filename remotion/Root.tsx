import { Composition } from "remotion";
import { GrabSpecPromo } from "./Video";

export const Root: React.FC = () => {
  return (
    <Composition
      id="GrabSpecPromo"
      component={GrabSpecPromo}
      durationInFrames={1350}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
