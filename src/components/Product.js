import React from "react";
//prettier-ignore
import { Notification, Popover, Button, Dialog, Card, Form, Input, Radio } from "element-react";

import { S3Image } from 'aws-amplify-react'

import { API, graphqlOperation } from 'aws-amplify'
import { updateProduct, deleteProduct } from '../graphql/mutations'

import { convertCentsToDollars, convertDollarsToCents } from '../utils'

import { userContext } from '../App'

import PayButton from './PayButton'

class Product extends React.Component {
  state = {
    updateProductDialog: false,
    description: "",
    price: "",
    shipped: false,
    deleteProductDialog: false
  };

  componentDidMount(){
    console.dir(S3Image);
  }

  handleUpdateProduct = async productId =>{
    try{
      this.setState({ updateProductDialog: false })
      const { description, price, shipped } = this.state;
      const input = {
        id: productId,
        description,
        price: convertDollarsToCents(price),
        shipped
      }
      const response = await API.graphql(graphqlOperation(updateProduct, { input }))
      console.log({response})
      Notification({
        title:"Success",
        message: "Product successfully updated",
        type: "success"
      })
    } catch(err){
      console.error(`Failed to update product with ID: ${productId}`)
    }
  }

  handleDeleteProduct = async productId => {
    try{
      this.setState({ deleteProductDialog: false })
      const input = {
        id: productId
      }
      const response = await API.graphql(graphqlOperation(deleteProduct, { input }))
      console.log(response)
      Notification({
        title:"Success",
        message: "Product successfully deleted",
        type: "success"
      })
    } catch(err){
      console.error("Error deleting product: ", err)
    }
  }
  
  render() {
    const { product } = this.props;
    const { updateProductDialog, deleteProductDialog, description, price, shipped} = this.state;
    console.log(product)
    return (
      <userContext.Consumer>
        {({user}) => {
          console.log(user)
          const isProductOwner = user && user.attributes.sub === product.owner;
          
          return (
            <div className="card-container">
              <Card bodyStyle={{ padding: 0, minWidth: '200px'}}>
                <S3Image 
                  imgKey={product.file.key}
                  theme={{
                    photoImg: { maxWidth: "100%", maxHeight: "100%"}
                  }}
                />
                <div className="card-body">
                  <h3 className="m-0">{product.description}</h3>
                  <div className="items-center">
                    <img 
                      src={`https://icon.now.sh/${product.shipped ? "markunread_mailbox" : "mail"}`}
                      alt="Shipping Icon"
                      className="icon"
                    />
                    {product.shipped ? "Shipped" : "Emailed"}
                  </div>
                  <div className="text-right">
                    <span className="mx-1">
                      ${convertCentsToDollars(product.price)}
                      
                    </span>
                    {!isProductOwner && (
                      <PayButton product={product} user={user} />
                    )}
                  </div>
                </div>
              </Card>
              {/* Update / Delete Products */}
              <div className="text-center">
                {isProductOwner && (
                  <>
                    <Button
                      type="warning"
                      icon="edit"
                      className="m-1"
                      onClick={()=> this.setState({ 
                        updateProductDialog: true ,
                        description: product.description,
                        shipped: product.shipped,
                        price: convertCentsToDollars(product.price)
                        })}
                    />
                    <Popover
                        placement="top"
                        width="160"
                        trigger="click"
                        content={
                          <>
                            <p>Do you want to delete this?</p>
                            <div className="text-right">
                              <Button
                                size="mini"
                                text="text"
                                className="m-1"
                                onClick={()=> this.setState({deleteProductDialog: false})}
                              >
                                Cancel
                              </Button>
                              <Button
                                type="primary"
                                size="mini"
                                className="m-1"
                                onClick={()=> this.handleDeleteProduct(product.id)}
                              >
                                Confirm
                              </Button>
                            </div>
                          </>
                        }
                    >
                      <Button
                        type="danger"
                        icon="delete"
                        className="m-1"
                        onClick={()=>this.setState({deleteProductDialog: true})}
                      />
                    </Popover>
                  </>
                )}
              </div>
              {/* update product dialogue */}
              <Dialog
                  title="Update Product"
                  size="large"
                  customClass="dialog"
                  visible={updateProductDialog}
                  onCancel={()=>this.setState({ updateProductDialog: false })}
              >
                  <Dialog.Body>
                    <Form labelPosition="top">
                      <Form.Item label="Update">
                        <Input 
                          icon="information"
                          placeholder="Product description"
                          value={description}
                          trim={true}
                          onChange={description=>this.setState({ description })}
                        />
                      </Form.Item>
                      <Form.Item label="Update Price">
                        <Input 
                          type="number"
                          icon="plus"
                          placeholder="Price ($USD)"
                          value={price}
                          onChange={price=>this.setState({ price })}
                        />
                      </Form.Item>
                      <Form.Item label="Update Shipping">
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

                    </Form>
                  </Dialog.Body>
                  <Dialog.Footer>
                    <Button
                        type="warning"
                        onClick={()=>this.setState({ updateProductDialog: false })}
                    >
                      Cancel
                    </Button>
                    <Button
                        type="primary"
                        onClick={() => this.handleUpdateProduct(product.id)}
                    >
                      Update
                    </Button>
                  </Dialog.Footer>
              
              </Dialog>
            </div>
          )
        }}
      </userContext.Consumer>
    )
  }
}

export default Product;
