import React from "react";
import { withRouter } from 'react-router-dom'

import { API, Auth, graphqlOperation } from 'aws-amplify'
import { getMarket } from '../graphql/queries'
import { onCreateProduct, onUpdateProduct, onDeleteProduct } from '../graphql/subscriptions'


import { Loading, Tabs, Icon, Button } from "element-react";

import NewProduct from '../components/NewProduct'
import Product from '../components/Product'

class MarketPage extends React.Component {
  state = {
    market: null,
    isLoading: true,
    isMarketOwner: false
  };
  

  async componentDidMount(){
    const owner = Auth.user.attributes.sub;
    this.handleGetMarket();
    console.log("OWNER", owner)
    this.createProductListener = await API.graphql(graphqlOperation(onCreateProduct, { owner }))
      .subscribe({
        next: productData => {
          const createdProduct = productData.value.data.onCreateProduct;
          const prevProducts = this.state.market.products.items
            .filter(item => item.id !== createdProduct.id );
          const updatedProducts = [createdProduct, ...prevProducts];
          const market = {...this.state.market}
          market.products.items = updatedProducts
          this.setState({market})
        }
    })
    this.updateProductListener = await API.graphql(graphqlOperation(onUpdateProduct, { owner }))
      .subscribe({
        next: productData => {
          const updatedProduct = productData.value.data.onUpdateProduct;
          const index = this.state.market.products.items
            .findIndex(item => item.id === updatedProduct.id)
          const updatedProducts = [...this.state.market.products.items]
          updatedProducts[index] = updatedProduct;
          const market = {...this.state.market}
          market.products.items = updatedProducts
          this.setState({market})
        }
    })
    this.deleteProductListener = await API.graphql(graphqlOperation(onDeleteProduct, { owner }))
      .subscribe({
        next: productData => {
          const deletedProduct = productData.value.data.onDeleteProduct;
          const updatedProducts = this.state.market.products.items
            .filter(item => item.id !== deletedProduct.id );
          const market = {...this.state.market};
          market.products.items = updatedProducts;
          this.setState({market})
        }
    })
    
  }

  componentWillUnmount(){
    this.createProductListener.unsubscribe();
    this.updateProductListener.unsubscribe();
    this.deleteProductListener.unsubscribe();
  }

  handleGetMarket = async () => {
    try{
      const input = {
        id: this.props.marketId
      };
      const response = await API.graphql(graphqlOperation(getMarket, input ));
      this.setState({market: response.data.getMarket, isLoading: false}, ()=>this.checkMarketOwner())
    }catch(err){
      console.log(err);
    }
    
  }

  checkMarketOwner = () => {
    const { user } = this.props;
    const { market } = this.state;
    if(user){
      this.setState({isMarketOwner: user.username === market.owner})
    }
  }

  render() {
    const { market, isLoading, isMarketOwner } = this.state;
    console.log(market)
    return isLoading ? (
      <Loading fullscreen={true}/>
    ) : (
      <>
        {/* Back Button */}
        <Button onClick={()=>this.props.history.push("/")}>Back to Markets List</Button>
        {/* Market Metadata */}
        <div className="items-center pt-2">
          <h2 className="mb-mr">{market.name}</h2> - {market.owner}
        </div>
        <div className="items-center pt-2">
          <span style={{ color: "var(--lightSquidInk)", paddingBottom: "1em"}}>
            <Icon name="date" className="icon"/>
            {market.createdAt}
          </span>
        </div>
        {/* New Product */}
        <Tabs type="border-card" value={isMarketOwner ? "1" : "2"}>
          {isMarketOwner && (
            <Tabs.Pane
              label={
                <>
                  <Icon name="plus" className="icon"/>
                  Add Product
                </>
              }
              name="1"
            >
              <NewProduct marketId={this.props.marketId} />
            </Tabs.Pane>
          )}
          {/* Products List */}
          <Tabs.Pane
            label={
              <>
                <Icon name="menu" className="icon"/>
                Products ({ market.products.items.length})
              </>
            }
            name="2"
          >
            <div className="product-list">
              {market.products.items.map(product => (
                <Product key={product.id} product={product} />
              ))}
            </div>
          </Tabs.Pane>
        </Tabs>
      </>
    )
  }
}

export default withRouter(MarketPage);
