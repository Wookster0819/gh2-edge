import { Switch, Route } from "wouter";
import VideoTemplate from "./components/video/VideoTemplate";

function App() {
  return (
    <Switch>
      <Route path="/" component={VideoTemplate} />
      {/* Add more routes here if needed */}
      <Route>404 Page Not Found</Route>
    </Switch>
  );
}

export default App;