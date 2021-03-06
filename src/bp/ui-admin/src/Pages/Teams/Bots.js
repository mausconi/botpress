import React, { Component } from 'react'

import { IoIosBoxOutline } from 'react-icons/lib/io'
import { MdCreate } from 'react-icons/lib/md'
import { connect } from 'react-redux'
import jdenticon from 'jdenticon'

import {
  ListGroup,
  Jumbotron,
  ListGroupItemHeading,
  ListGroupItem,
  Row,
  Col,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  FormGroup,
  FormFeedback,
  Label,
  Input
} from 'reactstrap'

import _ from 'lodash'

import { fetchTeamData } from '../../modules/teams'
import { fetchPermissions } from '../../modules/user'

import SectionLayout from '../Layouts/Section'
import LoadingSection from '../Components/LoadingSection'

import api from '../../api'

class Bots extends Component {
  state = {
    isEditBotModalOpen: false,
    isCreateBotModalOpen: false,
    errorCreateBot: undefined,
    errorEditBot: undefined,
    id: '',
    name: '',
    description: ''
  }

  renderLoading() {
    return <LoadingSection />
  }

  componentDidMount() {
    this.props.fetchTeamData(this.props.teamId, { bots: true })
    this.props.fetchPermissions(this.props.teamId)
  }

  componentDidUpdate(prevProps) {
    if ((!this.props.bots && !this.props.loading) || prevProps.teamId !== this.props.teamId) {
      this.props.fetchTeamData(this.props.teamId, { bots: true })
    }
    if (prevProps.teamId !== this.props.teamId) {
      this.props.fetchPermissions(this.props.teamId)
    }
  }

  onInputKeyPress = e => e.key === 'Enter' && this.createBot()

  onBotNameChange = e => {
    const name = e.target.value
    const id = name
      .toLowerCase()
      .replace(/\s/g, '-')
      .replace(/[$&+,:;=?@#|'<>.^*()%!]/g, '')

    this.setState({ name, id })
  }

  createBot = async () => {
    let id = this.state.id
    if (id[id.length - 1] === '-') {
      id = id.slice(0, id.length - 1)
    }

    await api
      .getSecured()
      .post(`/admin/teams/${this.props.teamId}/bots`, { id, name: this.state.name })
      .catch(err => this.setState({ errorCreateBot: err }))
    await this.props.fetchTeamData(this.props.teamId)
    this.toggleCreateBotModal()
  }

  editBot = async () => {
    await api
      .getSecured()
      .put(`/admin/teams/${this.props.teamId}/bots/${this.state.id}`, {
        name: this.state.name,
        description: this.state.description
      })
      .catch(err => this.setState({ errorEditBot: err }))
    await this.props.fetchTeamData(this.props.teamId)
    this.toggleEditBotModal()
  }

  toggleCreateBotModal = () => {
    this.setState({ isCreateBotModalOpen: !this.state.isCreateBotModalOpen, id: '', name: '' })
  }

  toggleEditBotModal = async bot => {
    if (this.state.isEditBotModalOpen) {
      this.setState({
        isEditBotModalOpen: false,
        id: '',
        name: '',
        description: ''
      })
    } else {
      this.setState({
        isEditBotModalOpen: true,
        id: bot.id,
        name: bot.name,
        description: bot.description
      })
    }
  }

  renderCreateBot() {
    return (
      <Modal isOpen={this.state.isCreateBotModalOpen} toggle={this.toggleCreateBotModal}>
        <ModalHeader toggle={this.toggleCreateBotModal}>Create a new bot</ModalHeader>
        <ModalBody>
          <FormGroup>
            <Label for="id">
              <strong>Identifier</strong>
            </Label>
            <Input placeholder="Auto-generated" disabled={true} type="text" id="id" value={this.state.id} />
          </FormGroup>
          <FormGroup>
            <Label for="name">
              <strong>Name</strong>
            </Label>
            <Input
              type="text"
              id="name"
              value={this.state.name}
              onKeyPress={this.onInputKeyPress}
              onChange={this.onBotNameChange}
            />
            {!!this.state.errorCreateBot && <FormFeedback>{this.state.errorCreateBot.message}</FormFeedback>}
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onClick={this.createBot}>
            Create
          </Button>
        </ModalFooter>
      </Modal>
    )
  }

  renderEditBot() {
    return (
      <Modal isOpen={this.state.isEditBotModalOpen} toggle={this.toggleEditBotModal}>
        <ModalHeader toggle={this.toggleEditBotModal}>Edit {this.state.name}</ModalHeader>
        <ModalBody>
          <FormGroup>
            <Label for="name">
              <strong>Name</strong>
            </Label>
            <Input
              type="text"
              id="name"
              value={this.state.name}
              onChange={e => this.setState({ name: e.target.value })}
            />
          </FormGroup>
          <FormGroup>
            <Label for="description">
              <strong>Description</strong>
            </Label>
            <Input
              type="text"
              id="description"
              value={this.state.description}
              onChange={e => this.setState({ description: e.target.value })}
            />
            {!!this.state.errorEditBot && <FormFeedback>{this.state.errorEditBot.message}</FormFeedback>}
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onClick={this.editBot}>
            Edit
          </Button>
        </ModalFooter>
      </Modal>
    )
  }

  async deleteBot(botId) {
    if (window.confirm("Are you sure you want to delete this bot? This can't be undone.")) {
      await api.getSecured().delete(`/admin/teams/${this.props.teamId}/bots/${botId}`)
      await this.props.fetchTeamData(this.props.teamId)
    }
  }

  renderEmptyBots() {
    return (
      <div className="bots">
        <Jumbotron>
          <Row>
            <Col style={{ textAlign: 'center' }} sm="12" md={{ size: 8, offset: 2 }}>
              <h1>
                <IoIosBoxOutline />
                &nbsp; This team has no bot, yet.
              </h1>
              <p>In Botpress, bots are always assigned to a team.</p>
            </Col>
          </Row>
        </Jumbotron>
        {this.renderCreateBot()}
      </div>
    )
  }

  renderCreateNewBotButton() {
    return (
      <Button
        className="float-right"
        onClick={() => this.setState({ isCreateBotModalOpen: true })}
        color="primary"
        size="sm"
      >
        <MdCreate /> Create Bot
      </Button>
    )
  }

  renderBots() {
    const bots = _.orderBy(this.props.bots, ['id'], ['desc'])

    if (!bots.length) {
      return this.renderEmptyBots()
    }

    return (
      <div className="bots">
        <Row>
          <Col xs={12} md={8}>
            {this.renderCreateBot()}
            {this.renderEditBot()}
            <ListGroup>
              {bots.map(bot => {
                return (
                  <ListGroupItem key={'bot-' + bot.id}>
                    <ListGroupItemHeading>
                      <a className="title" href={`/studio/${bot.id}`}>
                        {bot.name}
                      </a>
                    </ListGroupItemHeading>
                    <span>{bot.description}</span>
                    <div className="list-group-item__actions">
                      <Button color="link" onClick={() => this.toggleEditBotModal(bot)}>
                        Edit
                      </Button>
                      <Button color="link" onClick={() => this.deleteBot(bot.id)}>
                        Delete
                      </Button>
                    </div>
                  </ListGroupItem>
                )
              })}
            </ListGroup>
          </Col>
        </Row>
      </div>
    )
  }

  renderSideMenu() {
    return null
  }

  render() {
    if (this.props.loading || !this.props.bots) {
      return this.renderLoading()
    }

    setTimeout(() => {
      jdenticon()
    }, 10)

    return (
      <SectionLayout
        title={`${this.props.team.name}'s bots`}
        helpText="This page lists all the bots created under this team."
        activePage="bots"
        currentTeam={this.props.team}
        mainContent={this.renderBots()}
        sideMenu={this.renderCreateNewBotButton()}
      />
    )
  }
}

const mapStateToProps = state => ({
  bots: state.teams.bots,
  teamId: state.teams.teamId,
  team: state.teams.team,
  loading: state.teams.loadingTeam
})

const mapDispatchToProps = {
  fetchTeamData,
  fetchPermissions
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Bots)
