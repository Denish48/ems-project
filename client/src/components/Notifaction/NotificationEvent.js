import React, { useState, useEffect, useCallback } from "react";
import { Card, Table, Button, message, Popconfirm } from "antd";
import { Link } from "react-router-dom";
import Service from "../../service";
import {
  hideAuthLoader,
} from "../../appRedux/actions/Auth";
import { useDispatch } from 'react-redux';
import { DeleteOutlined } from "@ant-design/icons";

const NotificationEvent = () => {
  const [notificationData, setNotification] = useState([]);
  const dispatch = useDispatch();
  const [searchText, setSearchText] = useState("");
  const [seachEnabled, setSearchEnabled] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });
  // const searchRef = useRef();

  useEffect(() => {
    getNotification();
  }, [searchText, pagination.current, pagination.pageSize]);
  const getNotification = useCallback(async () => {
    try {
      // dispatch(showAuthLoader());
      const reqBody = {
        pageNum: pagination.current,
        pageLimit: pagination.pageSize,
      };
      if (searchText && searchText !== "") {
        reqBody.search = searchText;
        setSearchEnabled(true);
      }
      const response = await Service.makeAPICall({
        methodName: Service.postMethod,
        api_url: Service.notificationList,
        body: reqBody
      });
      // dispatch(hideAuthLoader());
      if (response.data && response.data.result) {
        setPagination({
          ...pagination,
          total: response.data.metaData.totalFilteredCount,
        });
        setNotification(response.data.result)
      }
      else {
        setPagination({
          ...pagination,
          total: 0,
        });
        setNotification([])
      }
    } catch (error) {
      dispatch(hideAuthLoader());
      console.log(error);
    }
  }, [searchText, pagination.current, pagination.pageSize])

  const Deletenotification = async (id) => {
    try {
      // dispatch(showAuthLoader());
      const params = `${id}`;
      const response = await Service.makeAPICall({
        methodName: Service.deleteMethod,
        api_url: Service.deleteNotification,
        body: {
          message_id: params
        },
      });
      // dispatch(hideAuthLoader());

      if (response.data && response.data.data) {
        getNotification();
      } else {
        message.error(response.data.message)
      }
    } catch (error) {
      // dispatch(hideAuthLoader());
      console.log(error);
    }
  };


  const columns = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      render: (text, record, index) => {
        const title =
          record?.custom_field?.notfication?.title
        return <span style={{ textTransform: "capitalize" }}>{title}</span>
      }

      // <span>{record?.custom_field?.notfication?.title}</span>

    },
    {
      title: "Event Name",
      dataIndex: "event_name",
      key: "department",
      render: (text, record, index) => (
        <span style={{ textTransform: "capitalize" }}>{record?.events?.length > 0 ? record?.events[0]?.event_name : ''}</span>
      ),
    },

    {
      title: "Message",
      dataIndex: "message",
      key: "message",
      render: (text, record, index) => (
        <span style={{ textTransform: "capitalize" }}>{record?.custom_field?.notfication?.body}</span>
      ),
    },
    {
      title: "Actions",
      dataIndex: "action",
      render: (text, record, index) => (
        <div
          style={{
            display: "flex",
            flexwrap: "wrap",
          }}
        >
          <Popconfirm
            title="Sure to delete?"
            onConfirm={() => Deletenotification(record._id)}
          >
            <Button type="link success" title="Delete">
              <DeleteOutlined style={{ fontSize: "18px" }} />
            </Button>
          </Popconfirm>

        </div>
      ),
    },
  ];
  const handleTableChange = (page, filters, sorter) => {
    setPagination({ ...pagination, ...page });
  };

  const getFooterDetails = () => {
    return (
      <label>
        Total Records Count is {pagination.total > 0 ? pagination.total : 0}
      </label>
    )
  }

  return (
    <Card title="Notifications">
      <Link to="/notification/add-notification">
        <Button type="primary" style={{ float: "right" }}>
          Add Notification
        </Button>
      </Link>

      <Table
        // className="gx-table-responsive"
        pagination={
          {
            showSizeChanger: true,
            pageSize: [500],
            ...pagination
          }
        }
        onChange={handleTableChange}
        columns={columns}
        dataSource={notificationData}
        footer={getFooterDetails}
      />
    </Card>
  );
};

export default NotificationEvent;