import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from "react-redux";
import {
    Button,
    Popconfirm,
    Form,
    Card,
    Modal,
    Table,
    Input,
    Radio,
    Space,
    Select,
    Menu,
    message,

} from "antd";
import { Link } from "react-router-dom";
import Service from "../../service";
import {
    DeleteOutlined,
    EditOutlined,
    EyeOutlined
} from "@ant-design/icons";


const AddTemplate = (props) => {
    const [IsModalView, setIsModalView] = useState(false);
    const [IsModalUpdate, setIsModalUpdate] = useState(false)
    const [viewTemplate, setviewTemplate] = useState({
        isModal: false,
        viewData: null
    })
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
    });
    const [templateList, setTemplateList] = useState([]);
    const [templateType, setTemplateType] = useState(false)
    const [editCode, setEditCode] = useState(null)
    const [toggleButton, settoggleButton] = useState(false)
    const [editTemplate, seteditTemplate] = useState(null)
    const [formData, setFormData] = useState({
        templateName: '',
        template: '',
    })

    const [form] = Form.useForm();
    const { Option } = Select;
    const { TextArea } = Input;
    const { authUser } = useSelector(
        ({ auth }) => auth
    );
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

    const HandleInputs = async (e) => {

        let name, value;
        name = e.target.name;
        value = e.target.value;

        setFormData({ ...formData, [name]: value })

    }

    const openTemplateModalView = () => {
        setFormData({
            templateName: '',
            template: '',
        });
        form.resetFields();
        setTemplateType(false)
        setIsModalView(true);
    }

    const closeEventModalView = () => {
        setTemplateType(false)
        setIsModalView(false);
    };
    useEffect(() => {
        getTemplateData();

    }, [IsModalView, pagination.current, IsModalUpdate]);

    const addTemplate = async () => {
        try {
            const response = await Service.makeAPICall({
                methodName: Service.postMethod,
                api_url: Service.addPostcardTemplete,
                body: {
                    templete_name: formData.templateName?.trim(),
                    templete: formData.template,
                    org_id: authUser?.org_id?._id,
                    user_id: authUser?._id
                },
            });
            if (response.data && response.data.data) {
                message.success(response.data.message)
                closeEventModalView();
            }
        } catch (error) {
            console.log(error);
        }
    };
    const getTemplateData = async () => {
        try {

            const reqBody = {
                pageNum: pagination.current,
                pageLimit: pagination.pageSize,
            };

            const response = await Service.makeAPICall({
                methodName: Service.postMethod,
                api_url: Service.postCardTempleteList,
                body: reqBody,
            });
            if (!response) {
                return Service.messageError(Service.error_message);
            }

            if (
                response &&
                response.data &&
                response.data.data
            ) {
                if (response.data.data.length > 0) {
                    const templateDetails = response.data.data;
                    setTemplateList(templateDetails);
                    setPagination({
                        ...pagination,
                        total: response.data.metaData.totalFilteredCount,
                    });
                } else {
                    setPagination({
                        ...pagination,
                        total: 0,
                    });
                    setTemplateList([]);
                    message.error(response.data.message);
                }
            }
        } catch (error) {
            // dispatch(hideAuthLoader());
            console.log(error);
        }
    };

    const deleteTemplate = async (id) => {

        try {
            const params = `/${id}`;
            const response = await Service.makeAPICall({
                methodName: Service.deleteMethod,
                api_url: Service.deletePostcardTempleteById + params,
            });
            if (response.data && response.data.data) {
                getTemplateData();
                message.success(response.data.message)
            } else {
                message.error(response.data.message)
            }
        } catch (error) {
            console.log(error);
        }

    }

    const achieveTemplateType = (e) => {
        setFormData({ ...formData, templateName: e })
    }

    const previewDemoModal = async (templet_id) => {
        try {
            let user_id = "61389bce3c9448142cc36149"
            // let user_id = authUser._id
            const body = {
                user_id: user_id,
                postCard_templete_id: templet_id
            }
            const response = await Service.makeAPICall({
                methodName: Service.postMethod,
                api_url: Service.previewtemplete,
                body,
            });
            if (response.data) {
                setviewTemplate({ isModal: true, viewData: response.data })
            }
        } catch (error) {
            // dispatch(hideAuthLoader());
            console.log(error);
        }
    }

    const viewTemplateClose = () => {
        setviewTemplate({ isModal: false, viewData: null })
    }
    const editTemplateClose = () => {
        setIsModalUpdate(false)
    }
    const editTemplateModal = async (record) => {
        setIsModalUpdate(true)
        seteditTemplate(record)
        setEditCode(record.templete)
    }

    const editTemplateFunction = async () => {
        try {
            const params = `/${editTemplate._id}`;
            const response = await Service.makeAPICall({
                methodName: Service.putMethod,
                api_url: Service.editPostcardTemplete + params,
                body: {
                    templete_name: editTemplate.templete_name,
                    templete: editCode,
                    // user_id: authUser?._id
                },
            });
            if (response.data && response.data.data) {
                message.success(response.data.message)
                setIsModalUpdate(false)
            }
        } catch (error) {
            console.log(error);
        }
    };


    const columns = [
        {
            title: "Template Name",
            dataIndex: "template_name",
            key: "name",
            render: (text, record, index) => {
                const templete_name = record.templete_name
                return <span style={{ textTransform: "capitalize" }}>{templete_name}</span>;
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
                    <Button type="link success" title="Update" onClick={() => editTemplateModal(record)}>
                        <EditOutlined style={{ fontSize: "18px" }} />
                    </Button>

                    <Popconfirm
                        title="Sure to delete?"
                        onConfirm={() => deleteTemplate(record._id)}
                    >
                        <Button type="link success" title="Delete">
                            <DeleteOutlined style={{ fontSize: "18px" }} />
                        </Button>
                    </Popconfirm>
                    <Link to='#' type="button">
                        <Button type="link success" title="View"
                            onClick={() => previewDemoModal(record._id)}
                        >
                            <EyeOutlined
                                style={{ fontSize: "18px" }}
                            />
                        </Button>
                    </Link>
                </div>
            ),
        },
    ];


    return (
        <>
            <Card className="gx-card" title="Templates List">

                <span style={{ display: "flex", justifyContent: 'flex-end' }}>
                    <Button type="primary" onClick={() => openTemplateModalView()}>Add Template</Button>
                </span>
                <h4>List of Templates:</h4>
                <Table
                    pagination={
                        {
                            showSizeChanger: true,
                            
                            ...pagination
                        }
                    }
                    onChange={handleTableChange}
                    columns={columns}
                    dataSource={templateList}
                    footer={getFooterDetails}
                    rowKey={(record) => record._id}
                />
                <Modal
                    title="Add Template"
                    width={900}
                    visible={IsModalView}
                    okText="Update"
                    footer={false}
                    onCancel={closeEventModalView}
                >
                    < Button id="addbutton" type="primary" onClick={() => settoggleButton(!toggleButton)}>
                        {toggleButton ? "Edit HTML" : "Preview"}
                    </Button>
                    <Form layout="vertical" form={form}>
                        {!toggleButton ?
                            <Form.Item
                                label="Select Template Type"
                                name="isActive"
                                rules={[
                                    {
                                        required: true,
                                        message: 'Please Select Option',
                                    }
                                ]}
                            >
                                <Radio.Group name='templateName' onChange={HandleInputs}>
                                    <Space direction="horizontal">
                                        <Radio value="Birthday" onClick={() => setTemplateType(false)}>Birthday</Radio>
                                        <Radio value="Achievement" onClick={() => setTemplateType(true)}>Achievement</Radio>
                                    </Space>
                                </Radio.Group>
                                {templateType === true ?
                                    <Select placeholder="select Achive type" style={{ width: 200 }} onChange={achieveTemplateType}>
                                        <Option value="Rising Star">Rising Star</Option>
                                        <Option value="Employee of the Year">Employee of the Year</Option>
                                        <Option value="star performance">star performance</Option>
                                    </Select> : null
                                }
                            </Form.Item> : null}
                        <Form.Item
                            name="content"
                            rules={[
                                {
                                    required: true,
                                    message: 'Please input your html content',
                                }
                            ]}
                        >
                            {!toggleButton ?
                                <TextArea
                                    name='template'
                                    rows={4}
                                    size='large'
                                    style={{ height: '200px' }}
                                    onChange={HandleInputs}
                                    value={formData && formData.template}
                                />
                                :

                                <div dangerouslySetInnerHTML={{ __html: formData && formData.template }}></div>
                            }

                        </Form.Item>
                        <Form.Item >
                            <Button id="addbutton" type="primary" onClick={addTemplate} htmlType="submit">
                                Add Template
                            </Button>
                        </Form.Item>
                    </Form>
                </Modal>

                <Modal
                    // title="Preview"
                    width={1100}
                    visible={viewTemplate && viewTemplate.isModal === true}
                    okText="Update"
                    footer={false}
                    onCancel={viewTemplateClose}
                >
                    <div dangerouslySetInnerHTML={{ __html: viewTemplate && viewTemplate?.viewData }}></div>
                </Modal>
                {editTemplate ?
                    <Modal
                        title="Update Template"
                        width={900}
                        visible={IsModalUpdate === true}
                        okText="Update"
                        footer={false}

                        onCancel={editTemplateClose}
                    >
                        <div style={{ marginBottom: 30 }}>< Button id="addbutton" type="primary" onClick={() => settoggleButton(!toggleButton)}>
                            {toggleButton ? "Edit HTML" : "Preview"}
                        </Button></div>
                        <Form
                            layout="vertical"
                            name="editForm"
                            form={form}
                            initialValues={editTemplate}


                        >
                            <Form.Item
                                name="templete"
                            >
                                {!toggleButton ?
                                    <>
                                        <TextArea
                                            name='templete'
                                            rows={4}
                                            size='large'
                                            style={{ height: 300 }}
                                            onChange={(e) => setEditCode(e.target.value)}
                                            value={editCode}

                                        />
                                    </>
                                    :
                                    <div dangerouslySetInnerHTML={{ __html: editCode && editCode }}></div>
                                }
                            </Form.Item>

                            <Form.Item >
                                <Button id="update" onClick={(e) => editTemplateFunction(e)} type="primary" >
                                    Update Template
                                </Button>
                            </Form.Item>
                        </Form>
                    </Modal>
                    : null}
            </Card>
        </>
    )
}

export default AddTemplate
