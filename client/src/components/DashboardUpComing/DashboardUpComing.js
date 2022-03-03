import React, { useState, useEffect } from "react";
import Widget from "components/Widget/index";

import PropertiesItemCard from "../PropertiesItemCard/PropertiesItemCard";
import Service from "../../service";

const DashboardUpComing = () => {
  const [upCominEvent, setUpCominEvent] = useState([]);

  useEffect(() => {
    getupcomingEvent();
  }, []);

  const getupcomingEvent = async () => {
    try {
      const response = await Service.makeAPICall({
        methodName: Service.postMethod,
        api_url: Service.upcomingEvents,
        body: {
          pageLimit: 5
        }
      });
      if (response.data && response.data.data) {
        setUpCominEvent(response.data.data);
      }
    } catch (error) {
      // dispatch(hideAuthLoader());
      console.log(error);
    }
  };
  return (
    <Widget>
      <div className="ant-row-flex gx-justify-content-between gx-mb-3 gx-mb-sm-4 gx-dash-search">
        <h2 className="h4 gx-mb-3 gx-mb-sm-1 gx-mr-2">Up Coming Events</h2>
      </div>
      {
        upCominEvent.length > 0 ?
          upCominEvent.map((data, index) => (
            <PropertiesItemCard key={index} data={data} />
          ))
          :
          <>No Upcomming Events yet</>
      }
    </Widget>
  );
};

export default DashboardUpComing;
