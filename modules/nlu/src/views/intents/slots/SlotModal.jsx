import React from 'react'
import Select from 'react-select'
import { Button, Modal } from 'react-bootstrap'
import nanoid from 'nanoid'

import style from './style.scss'

require('react-select/dist/react-select.css')
const N_COLORS = 8
const INITIAL_STATE = {
  id: null,
  name: '',
  entity: null,
  availableEntities: [],
  editing: false,
  color: false
}

export default class SlotModal extends React.Component {
  state = { ...INITIAL_STATE }

  fetchAvailableEntities = () => {
    return this.props.axios.get(`/mod/nlu/entities`).then(res => {
      const availableEntities = res.data.map(e => ({
        label: `@${e}`,
        value: e
      }))

      this.setState({ availableEntities })
    })
  }

  onNameChange = event => {
    this.setState({ name: event.target.value.replace(/[^A-Z0-9_-]/gi, '_') })
  }

  onEntityChanged = entity => {
    this.setState({ entity: entity.value })
  }

  componentDidMount() {
    this.fetchAvailableEntities()
    this.initializeFromProps(this.props)
  }

  componentWillReceiveProps(nextProps) {
    this.initializeFromProps(nextProps)
  }

  initializeFromProps = props => {
    const slot = props.slot
    console.log('slotter', slot)
    if (slot) this.setState({ ...slot, editing: true })
  }

  resetState = () => this.setState({ ...INITIAL_STATE, availableEntities: this.state.availableEntities })

  onSave = e => {
    e.preventDefault()

    const operation = this.state.editing ? 'modified' : 'created'
    const slot = {
      id: this.state.id || nanoid(),
      name: this.state.name,
      entity: this.state.entity,
      color: this.state.color || Math.round(Math.random() * N_COLORS)
    }

    this.props.onSlotSave && this.props.onSlotSave(slot, operation)
    this.closeModal()
  }

  closeModal = () => {
    this.resetState()
    this.props.onHide()
  }

  render() {
    const isValid = this.state.name && this.state.name.length && this.state.entity && this.state.entity.length

    return (
      <Modal show={this.props.show} bsSize="small" onHide={this.props.onHide} animation={false}>
        <Modal.Header closeButton>
          <Modal.Title>Create Slot for your intent</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <h4>Slot Name</h4>
          <input
            tabIndex="1"
            autoFocus
            className={style.entityNameInput}
            value={this.state.entityName}
            placeholder="Type a name here"
            onChange={this.onNameChange}
          />

          <h4>Associated Entity</h4>
          <Select
            tabIndex="2"
            name="entity-type"
            value={this.state.entity}
            onChange={this.onEntityChanged}
            options={this.state.availableEntities}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button tabIndex="3" bsStyle="primary" disabled={!isValid} onClick={this.onSave}>
            Create Slot
          </Button>
        </Modal.Footer>
      </Modal>
    )
  }
}
