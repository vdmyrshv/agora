import React from "react";
// prettier-ignore
import { Storage, Auth, API, graphqlOperation } from 'aws-amplify'
import { createProduct } from '../graphql/mutations'

import { Form, Button, Input, Notification, Radio, Progress } from "element-react";
import aws_exports from '../aws-exports'

import { PhotoPicker} from 'aws-amplify-react';

import { convertDollarsToCents } from '../utils'

const initialState = {
  description: "",
  price: "",
  imagePreview: "",
  image: "",
  shipped: false,
  isUploading: false,
  percentUploaded: 0
};

class NewProduct extends React.Component {
  state = {
    ...initialState
  };

  handleAddProduct = async () => {
    try {
      const { description, price, image, imagePreview, shipped } = this.state;

      console.log("state: ", this.state);

      this.setState({isUploading: true});

      const visibility = "public";
      const { identityId } = await Auth.currentCredentials();
      
      console.log(this.props.marketId)
      console.log("current credentials: ", identityId)
      console.log("Date: ", Date.now())
      
      const filename=`/${visibility}/${identityId}/${Date.now()}-${image.name}`

      console.log(filename)
    
      const uploadedFile = await Storage.put(filename, image.file, {
        contentType: image.type,
        progressCallback: progress => {
          console.log(`Uploaded: ${progress.loaded} of ${progress.total}`)
          const percentUploaded = Math.round((progress.loaded/progress.total) * 100)
          this.setState({ percentUploaded })
        }
      })
      
      console.log("Uploaded file properties ", uploadedFile)
      
      const file = {
        key: uploadedFile.key,
        bucket: aws_exports.aws_user_files_s3_bucket,
        region: aws_exports.aws_project_region
      }

      const input = {
        productMarketId: this.props.marketId,
        description, 
        file,
        price: convertDollarsToCents(price),
        shipped

      }
      const response = API.graphql(graphqlOperation(createProduct, { input } ));
      console.log("Created product: ", {response})
      this.setState({...initialState});
      Notification({
        title: "Success",
        message: "Product successfully created!",
        type: "success"
      })
    } catch(err){
      console.error("Error adding product", err.message)
    }

    
  }

  handleValidate = () => {
    const { description, price, imagePreview, isUploading } = this.state;
    const isDisabled = !description || !price || !imagePreview || isUploading;
    return isDisabled;
  }

  render() {
    
    const { 
      description, 
      price, 
      imagePreview, 
      shipped, 
      isUploading,
      percentUploaded 
    } = this.state;

    return (
      <div className="flex-center">
        <h2 className="header">Add New Product</h2>
        <div>
          <Form className="market-header">
            <Form.Item label="Add Product Description">
              <Input 
                type="text"
                icon="information"
                placeholder="description"
                value={description}
                onChange={description=>this.setState({ description })}
              />
            </Form.Item>
            <Form.Item label="Set Product Price">
              <Input 
                type="number"
                icon="plus"
                placeholder="Price ($USD)"
                value={price}
                onChange={price=>this.setState({ price })}
              />
            </Form.Item>
            <Form.Item label="Is the product shipped or emailed to the customer?">
              <Radio
                value={true}
                checked={shipped===true}
                onChange={() => this.setState({shipped: true})}
              >
                Shipped
              </Radio>
              <Radio
                value={false}
                checked={shipped===false}
                onChange={() => this.setState({shipped: false})}
              >
                Emailed
              </Radio>
            </Form.Item>
            {imagePreview && (
              <img 
                className="image-preview"
                src={imagePreview}
                alt="Product Preview"
              />
            )}
            {percentUploaded > 0 && (
              <Progress 
                type="circle"
                className="progress"
                status="success"
                percentage={percentUploaded}
              />
            )}
            <PhotoPicker
              title="Product Image"
              preview="hidden"
              onLoad={url => this.setState({ imagePreview: url })}
              onPick={file => this.setState({ image: file})} 
              theme={{
                formContainer: {
                  margin: 0,
                  padding: '0.8em',
                },
                formSection: {
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center"
                },
                sectionBody: {
                  margin: 0,
                  width: "250px"
                },
                sectionHeader: {
                  padding: '0.2em',
                  color: "var(--darkAmazonOrange)"
                },
                photoPickerButton: {
                  display: "none"
                }
              }}
            />
            <Form.Item>
                <Button
                  type="primary"
                  onClick={this.handleAddProduct}
                  disabled={this.handleValidate()}
                  loading={isUploading}
                >
                  {isUploading ? "Uploading..." : "Add Product"}
                </Button>
            </Form.Item>
          </Form>
        </div>
      </div>  
    )
  }
}

export default NewProduct;
