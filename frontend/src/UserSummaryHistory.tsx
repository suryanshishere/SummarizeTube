import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "shared/axios-instance";
import { triggerErrorMsg } from "store/response-thunk";
import { useDispatch } from "react-redux";
import { AppDispatch } from "store";
import RenderSummary from "RenderSummary";

interface SummaryHistory {
  message: string;
  data: string[];
}

const fetchUserHistory = async (): Promise<SummaryHistory> => {
  const response = await axiosInstance.get("/get-summary-history");
  return response.data;
};

const UserSummaryHistory = () => {
  const dispatch = useDispatch<AppDispatch>();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["userSummaryHistory"],
    queryFn: fetchUserHistory,
  });

  const [showAllItems, setShowAllItems] = useState<{ [key: number]: boolean }>(
    {}
  );

  if (isError && !isLoading) {
    dispatch(triggerErrorMsg("Failed to fetch user history"));
  }

  const handleToggleShow = (index: number) => {
    setShowAllItems((prev) => ({
      ...prev,
      [index]: !prev[index], // Toggle the current item's state
    }));
  };

  // If data is available and `data.data` exists, map through the items
  const historyToDisplay = data?.data || [];

  return (
    <div className="h-full w-3/5 bg-custom-gray p-2 flex flex-col gap-1">
      <h2 className="bg-custom-white w-full p-2 rounded text-center">
        <span className="underline text-custom-red text-2xl italic">YOUR</span>{" "}
        History
      </h2>
      <div className="overflow-y-auto flex flex-col gap-1 mt-2 bg-custom-white h-full p-1 pl-2">
        {isLoading && <p>Loading history...</p>}
        {isError && <p className="text-custom-red">Failed to load history</p>}
        {historyToDisplay.length > 0 ? (
          <ul>
            {historyToDisplay.map((item, index) => {
              const isShort = item.length > 100;
              const isExpanded = showAllItems[index]; // Check if the current item is expanded
              const displayText =
                isShort && !isExpanded ? `${item.substring(0, 100)}...` : item;
              return (
                <React.Fragment key={index}>
                  <li
                    className={`bg-custom-white my-2 p-2 rounded shadow cursor-pointer  ${
                      isShort && !isExpanded
                        ? "hover:bg-custom-pale-yellow"
                        : "bg-custom-pale-yellow  "
                    }`}
                    onClick={() => handleToggleShow(index)}
                  >
                    <RenderSummary summaryHistory={displayText} />
                  </li>
                  {index !== historyToDisplay.length - 1 && <hr />}
                </React.Fragment>
              );
            })}
          </ul>
        ) : (
          !isLoading && (
            <p className="h-full bg-custom-white">No history found.</p>
          )
        )}

        {/* "Show More" button, only visible if there are more than 50 items */}
        {data && data.data.length > 50 && (
          <button
            className="mt-2 bg-custom-red text-white p-2 rounded"
            onClick={() => setShowAllItems({})} // Reset to show all items when clicked
          >
            Show All
          </button>
        )}
      </div>
    </div>
  );
};

export default UserSummaryHistory;
