import * as React from "react";
import * as ReactDOM from "react-dom/client";
import {
    createBrowserRouter,
    RouterProvider,
} from "react-router-dom";
import "./index.css";
import FormContainer from "./components/Form/FormContainer";
import Profile from "./components/Profile/Profile";
import Dashboard from "./components/Profile/Admin/Dashboard/Dashboard";
import {ProfileDataProvider} from "./context/ProfileDataContext";
import ClientDashboard from "./components/Profile/Client/ClientDashboard/ClientDashboard";
import ClientTable from "./components/Profile/Client/ClientTable/ClientTable";
import {DataProvider} from "./context/DataContext";

const router = createBrowserRouter([
    {
        path: "/client",
        element: <ClientTable />,
    },
    {
        path: "/client/:clientId",
        element: <ClientDashboard />,
    },
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
            }
        ]
    },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
            <ProfileDataProvider>
                <DataProvider>
                    <RouterProvider router={router}/>
                </DataProvider>
            </ProfileDataProvider>
    </React.StrictMode>
);