import React, { useEffect, useState, } from 'react'
import { Button, Table, Card } from 'antd';
import Service from "../../service";
import {
  EyeOutlined
} from "@ant-design/icons";
import { Link } from 'react-router-dom';


const SurveyList = (props) => {
  const [feedbackData, setFeedbackData] = useState([])
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
      const response = await Service.makeAPICall({
        methodName: Service.postMethod,
        api_url: Service.surveyList,
        body: reqBody,

      });
      // dispatch(hideAuthLoader());
      if (response.data && response.data.data) {
        setPagination({
          ...pagination,
          total: response.data.metaData.totalFilteredCount,
        });
        setFeedbackData(response.data.data)
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
      title: 'Forms',
      dataIndex: 'survey_name',
      key: 'survey_name',
      render: (text, record, index) => {

        const survey_name = text?.charAt(0).toUpperCase() + text?.slice(1);
        return <Link type="button" to={`/elevate-forms/surveys-edit/${record._id}`}>{survey_name}</Link>
      }
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
          <Link type="button" to={`/elevate-forms/surveys/users/${record._id}`}>
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
      props.history.push('/elevate-forms');
    }
  };

  return (

    <Card title="Survey Forms">
      <Link to="/elevate-forms/surveys-add">
        <Button type="primary" style={{ float: "right" }}>
          Create Survey Form
        </Button>
      </Link>
      <Button type="primary" style={{ marginLeft: '10px' }} onClick={onCancel}>
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

        onChange={handleTableChange} dataSource={feedbackData} />
    </Card>
  )
}

export default SurveyList
