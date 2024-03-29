import { useEffect, useRef, useState } from 'react';
import { useUser } from '@realm/react';
import { TextInput, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRealm } from '../../libs/realm';

import { Button } from '../../components/Button';
import { LicensePlateInput } from '../../components/LicensePlateInput';
import { TextAreaInput } from '../../components/TextAreaInput';

import { Container, Content, Message } from './styles';
import { licensePlateValidate } from '../../utils/licensePlateValidate';
import { MainHeader } from '../../components/MainHeader';
import { Historic } from '../../libs/realm/schemas/Historic';
import { useNavigation } from '@react-navigation/native';

import { LocationAccuracy,
   useForegroundPermissions,
   watchPositionAsync, 
  LocationSubscription
 } from 'expo-location';


const keyboardAvoidingViewBehavior = Platform.OS === 'android' ? 'height' : 'position';

export function Departure() {
  const { goBack } = useNavigation();
  const user = useUser();
  const [description, setDescription] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // status da permissão - solicita permissão
  const [locationForegroundPermission, requestLocationForegroundPermission] = useForegroundPermissions();

  const realm = useRealm();

  const descriptionRef = useRef<TextInput>(null);

  function handleDepartureRegister() {
    try {
      if(!licensePlateValidate(licensePlate)) {
        return Alert.alert('Placa inválida', 'A placa é inválida. Por favor, informa a placa correta.')
      }
  
      if(description.trim().length === 0) {
        descriptionRef.current?.focus();
        return Alert.alert('Finalidade', 'Por favor, informe a finalidade da utilização do veículo')
      }

      setIsRegistering(true)

      realm.write(() => {
        realm.create('Historic', Historic.generate({
          user_id: user!.id,
          license_plate: licensePlate.toUpperCase(),
          description,
        }))
      });

      Alert.alert('Saída', 'Saída do veículo registrada com sucesso.')
      goBack();

    } catch (error) {
      console.log(error);
      Alert.alert('Erro', 'Não foi possível registrar a saída do veículo')
      setIsRegistering(false)
    }

  }

  useEffect(() => {
    requestLocationForegroundPermission();
  }, [])

  useEffect(() => {
    if(!locationForegroundPermission?.granted) {
      return;
    }

    let subscription: LocationSubscription


    // Obtendo localização do usuário
    watchPositionAsync({
      accuracy: LocationAccuracy.High,
      timeInterval: 1000,
    }, (location) => {
      console.log('test', location);
    })
      .then((response) => subscription = response);

    return () =>  subscription.remove();
  }, [locationForegroundPermission])


  if(!locationForegroundPermission?.granted) {
    return (
      <Container>
        <MainHeader title='Saída' />
        <Message>
          Você precisa permitir que o aplicativo tenha acesso a 
          localização para acessar essa funcionalidade. Por favor, acesse as
          configurações do seu dispositivo para conceder a permissão ao aplicativo.
        </Message>
      </Container>
    )
  }

  return (
    <Container>
      <MainHeader title='Saída' />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={keyboardAvoidingViewBehavior} >
        <ScrollView>
          <Content>
            <LicensePlateInput
              label='Placa do veículo'
              placeholder="BRA1234"
              returnKeyType='next'
              onChangeText={setLicensePlate}
            />

            <TextAreaInput
              ref={descriptionRef}
              label='Finalizade'
              placeholder='Vou utilizar o veículo para...'
              onSubmitEditing={handleDepartureRegister}
              returnKeyType='send'
              blurOnSubmit
              onChangeText={setDescription}
            />

            <Button 
              title='Registar Saída'
              onPress={handleDepartureRegister}
              isLoading={isRegistering}
            />
          </Content>
        </ScrollView>
      </KeyboardAvoidingView>
    </Container>
  );
}