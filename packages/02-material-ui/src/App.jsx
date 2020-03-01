import Dialog from "./Dialog";
import {HashRouter} from "react-router-dom";
import React from "react";
import {ThemeProvider} from "@material-ui/core";
import {theme} from "./theme";

const Page = React.lazy(() => import("host_app/Page"));
const SideNav = React.lazy(() => import("host_app/SideNav"));

function App() {
    return (
        <HashRouter>
            <ThemeProvider theme={theme}>
                <React.Suspense fallback={null}>
                    <div style={{display: "flex"}}>
                        <SideNav/>
                        <Page title="Material UI App">
                            <Dialog/>
                        </Page>
                    </div>
                </React.Suspense>
            </ThemeProvider>
        </HashRouter>
    );
}

export default App;
