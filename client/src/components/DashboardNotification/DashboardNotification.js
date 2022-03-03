import React, { useState, useEffect } from "react";
import { Card, Table } from "antd";
import Service from "../../service";

const DashboardNotification = () => {
  const [notificationData, setNotification] = useState([]);
  useEffect(() => {
    getNotification();
  }, []);
  const getNotification = async () => {
    try {
      // dispatch(showAuthLoader());
      const response = await Service.makeAPICall({
        methodName: Service.postMethod,
        api_url: Service.notificationList,
        body: {
          pageLimit: 5
        }
      });
      // dispatch(hideAuthLoader());
      if (response.data && response.data.result) {
        setNotification(response.data.result)
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
        const title = record?.custom_field?.notfication?.title
        return <span style={{ textTransform: "capitalize" }}>{title}</span>;
      }

    },
    {
      title: "Event Name",
      dataIndex: "event_name",
      key: "department",
      render: (text, record, index) => (
        <span style={{ textTransform: "capitalize" }}>{record?.events.length > 0 ? record?.events[0]?.event_name : ''}</span>
      ),
    },

    {
      title: "Message",
      dataIndex: "message",
      key: "message",
      render: (text, record, index) => {
        if (record?.custom_field?.notfication?.body) {
          const message =
            record?.custom_field?.notfication?.body
          return <span style={{textTransform: "capitalize"}}>{message}</span>;
          // <span>{record?.custom_field?.notfication?.body}</span>
        }
        else {
          return null
        }
      }


    },
  ];
  //   const [q, setQ] = useState("");

  //   const search = (rows) => {
  //     const columns = rows[0] && Object.keys(rows[0]);
  //     return rows.filter((row) =>
  //       columns.some(
  //         (column) =>
  //           row[column].toString().toLowerCase().indexOf(q.toLowerCase()) > -1
  //       )
  //     );
  //   };
  return (
    <Card title="Notifications">
      <Table
        className="gx-table-responsive"
        columns={columns}
        dataSource={notificationData}
        rowKey={record => record._id}
        pagination={false}
      />
    </Card>
  );
};

export default DashboardNotification;