import * as React from "react";
import * as ReactDOM from "react-dom/client";
import {
    createBrowserRouter,
    RouterProvider,
} from "react-router-dom";
import "./index.css";
import FormContainer from "./components/Form/FormContainer";
import Profile from "./components/Profile/Profile";
import Dashboard from "./components/Profile/Dashboard/Dashboard";
import {ProfileDataProvider} from "./context/ProfileDataContext";
import Icon from "./components/Profile/Dashboard/Icon";

const router = createBrowserRouter([
    {
        path: "/",
        element: <FormContainer/>,
    },
    {
        path: "/profile",
        element: <Profile/>,
        children: [
            {
                path: "/profile/dashboard",
                element: <Dashboard/>,
            },
            {
                path: "/profile/icon",
                element: <Icon/>,
            }
        ]
    },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
            <ProfileDataProvider>
                <RouterProvider router={router}/>
            </ProfileDataProvider>
    </React.StrictMode>
);