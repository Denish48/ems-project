import React, { useEffect, useState, } from 'react'
import { Button, Table, Card } from 'antd';
import Service from "../../service";
import {
  EyeOutlined
} from "@ant-design/icons";
import { Link } from 'react-router-dom';


const SurveyUsersList = (props) => {
  const id = props.match.params.id;
  const [surveyUsersData, setSurveyUsersData] = useState([])
  const [searchText, setSearchText] = useState("");
  const [seachEnabled, setSearchEnabled] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });
  useEffect(() => {
    getFeedback();
  }, [searchText, pagination.current, pagination.pageSize]);

  const getFeedback = async () => {
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
      const params = `/${id}`;
      const response = await Service.makeAPICall({
        methodName: Service.postMethod,
        api_url: Service.SurveyUsersList + params,
        body: reqBody,
      });
      // dispatch(hideAuthLoader());
      if (response.data && response.data.data) {
        setPagination({
          ...pagination,
          total: response.data.metaData.totalFilteredCount,
        });
        setSurveyUsersData(response.data.data)
      }
    } catch (error) {
      // dispatch(hideAuthLoader());
      console.log(error);
    }
  };
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
  const columns = [
    {
      title: "User Name",
      dataIndex: "full_name",
      key: "name",
      render: (text, record, index) => {
        const full_name =
          record?.user?.full_name

        return <span style={{ textTransform: "capitalize" }}>{full_name}</span>
      },
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
          <Link type="button" to={`/elevate-forms/surveys/users/answers/${record._id}`}>
            <Button type="link success" title="View">
              <EyeOutlined
                style={{ fontSize: "18px" }}
              />
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  const onCancel = () => {
    if (props.history.length > 1) {
      props.history.goBack();
    } else {
      props.history.push('/elevate-forms/surveys');
    }
  };

  return (

    <Card title="Survey Submitted By Users">
      <Button type="primary" style={{ float: "right", marginRight: '10px' }} onClick={onCancel}>
        Back
      </Button>

      <Table columns={columns} pagination={
        {
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "30"],
          ...pagination
        }
      }
        footer={getFooterDetails}

        onChange={handleTableChange} dataSource={surveyUsersData} />
    </Card>
  )
}

export default SurveyUsersList
