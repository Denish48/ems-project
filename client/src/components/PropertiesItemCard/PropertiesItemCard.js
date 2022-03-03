import React from "react";
import { Link } from "react-router-dom";
import { EyeOutlined } from "@ant-design/icons";
import {Button} from 'antd'
const PropertiesItemCard = ({ data }) => {
  return (
    <div className="gx-media gx-featured-item">
      <div className="gx-featured-thumb">{/* {date} */}</div>
      <div className="gx-media-body gx-featured-content">
        <div className="gx-featured-content-left">
          <h3 className="gx-mb-2" style={{textTransform: "capitalize"}}>{data.event_name}</h3>
          <div className="ant-row-flex">
            <p className="gx-mr-3 gx-mb-1">
              <span className="gx-text-grey"></span>
            </p>
          </div>
        </div>
        <div className="gx-featured-content-right">
      
        <Link type="button"  to={`/event/event-view/${data._id}`}>
            <Button type="link success">
              <EyeOutlined style={{ fontSize: "18px" ,textTransform: "capitalize" }} />
            </Button>
          </Link>
         
        </div>
      </div>
    </div>
  );
};

export default PropertiesItemCard;
