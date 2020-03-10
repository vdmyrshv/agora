import React, { createContext } from "react";
import "./App.css";
//eslint disable-next-line
import { Authenticator, withAuthenticator, AmplifyTheme } from 'aws-amplify-react';
import { Auth, Hub } from 'aws-amplify'
//eslint disable-next-line
import { BrowserRouter as Router, Route, Link, Switch } from 'react-router-dom'

import HomePage from './pages/HomePage'
import MarketPage from './pages/MarketPage'
import ProfilePage from './pages/ProfilePage'
import Navbar from './components/Navbar'

export const userContext = createContext();

class App extends React.Component {
  state = {
    user: null
  };

  componentDidMount(){
    console.dir(AmplifyTheme);
    console.dir(Auth);
    this.getUserData();
    Hub.listen('auth', this, 'onHubCapsule')
  }

  getUserData = async () => {
    const user = await Auth.currentAuthenticatedUser();
    user ? this.setState({user}) : this.setState({user: null})
  }

  onHubCapsule = capsule => {
    switch(capsule.payload.event){
      case "signIn":
        console.log('signed in')
        this.getUserData()
        break;
      case "signUp":
        console.log('signed Up')
        break;
      case "signOut":
        console.log('signed Out')
        this.setState({user: null})
        break;
      default:
        break;
    }
  }

  handleSignout = async () =>{
    try{
      await Auth.signOut();
    } catch (err) {
      console.error('Error signing out user', err);
    }
  }

  render() {
    const { user } = this.state;
    console.log(user)
    return !user ? (
      <Authenticator theme={theme}/> 
      ) : (
        <userContext.Provider value={{user}}>
          <Router>
            {/* Navbar */}
            <Navbar user={user} handleSignout={this.handleSignout}/>
          
            {/* Routes */}
              <div className="app-container">
                  <Route exact path="/" component={HomePage} />
                  <Route path="/profile" component={ProfilePage} />
                  <Route path="/markets/:marketId" component={
                    ({ match }) => <MarketPage user={user} marketId={match.params.marketId}/>} 
                  />
              </div>
          </Router>
        </userContext.Provider>
      )

  }
}

const theme = {
  //spread in all default themes first
  ...AmplifyTheme,
  button: {
    ...AmplifyTheme.button,
    backgroundColor: "var(--squidInk)",
    color: "var(--lightGrey)"
  },
  navBar: {
    ...AmplifyTheme.navBar,
    backgroundColor: "var(--squidInk)",
    color: "var(--lightGrey)",
    button: {
      backgroundColor: "--color-primary-highlight"
    }
  },
  sectionHeader: {
    ...AmplifyTheme.sectionHeader,
    backgroundColor: "var(--squidInk)",
    color: "var(--lightGrey)",
    borderRadius: "4px"
  },
  formSection: {
    ...AmplifyTheme.formSection,
    backgroundColor: "var(--lightAmazonOrange)",
    borderRadius: "4px"
  }
};

//export default withAuthenticator(App, true, [], null, theme)
export default App;
