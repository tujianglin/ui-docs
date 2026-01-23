<script setup lang="tsx">
import Basic from './Basic';
import Deadline from './Deadline';
import Debug from './Debug';
import List from './List';
import Provider from './Provider';
import SSR from './SSR';
import TransitionInsideDebug from './TransitionInsideDebug';
</script>

<template>
  <Story title="CSSMotion">
    <Variant title="Basic">
      <Basic />
    </Variant>
    <Variant title="Deadline">
      <Deadline />
    </Variant>
    <Variant title="Debug">
      <Debug />
    </Variant>
    <Variant title="List">
      <List />
    </Variant>
    <Variant title="Provider">
      <Provider />
    </Variant>
    <Variant title="SSR">
      <SSR />
    </Variant>
    <Variant title="Transition Inside Debug">
      <TransitionInsideDebug />
    </Variant>
  </Story>
</template>
